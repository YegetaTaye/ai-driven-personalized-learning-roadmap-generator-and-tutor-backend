"""
Core AI generation logic.
Mirrors the TypeScript ai.service.ts — same three-tier fallback chain,
same cache behaviour, same streaming/burst logic.
"""
import asyncio
import json
import logging
from collections.abc import AsyncIterator
from typing import Any, TypeVar

from app import cache as c
from app.cache import (
    EXPLANATION_TTL, MICRO_QUIZ_TTL, QUIZ_TTL, REMEDIAL_QUIZ_TTL,
    explanation_key, micro_quiz_key, quiz_key, remedial_quiz_key,
    get_cached, set_cache,
)
from app.circuit_breaker import is_circuit_open, record_failure, record_success
from app.clients.gemini_client import gemini_generate, gemini_stream
from app.clients.ollama_client import ollama_generate, ollama_stream
from app.clients.phi4_client import phi4_generate, phi4_stream
from app.config import settings
from app.prompts.ask_question import build_ask_prompt, build_stream_ask_prompt
from app.prompts.explanation_generation import (
    build_explanation_prompt, build_stream_explanation_prompt,
)
from app.prompts.micro_quiz_generation import build_micro_quiz_prompt
from app.prompts.quiz_generation import build_quiz_prompt
from app.schemas import (
    AskQuestionInput, ExplanationContext, GeneratedExplanation,
    GeneratedQuestion, GeneratedQuiz, NodeContextInput,
)

log = logging.getLogger(__name__)

T = TypeVar("T")


# ── JSON parsing & validation ──────────────────────────────────────────────────

def _parse_and_validate_quiz(raw: str | None) -> GeneratedQuiz | None:
    if not raw:
        return None
    candidates = [raw.strip()]
    unwrapped = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    if unwrapped != raw.strip():
        candidates.append(unwrapped)
    first = unwrapped.find("{")
    last = unwrapped.rfind("}")
    if first >= 0 < last and last > first:
        candidates.append(unwrapped[first: last + 1])

    for text in candidates:
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            continue
        # LLMs sometimes wrap: { quiz: {...} } or { data: {...} }
        for candidate in [obj, obj.get("quiz"), obj.get("data")] if isinstance(obj, dict) else [obj]:
            if not isinstance(candidate, dict):
                continue
            questions_raw = candidate.get("questions")
            if not isinstance(questions_raw, list) or not questions_raw:
                continue
            try:
                questions = [
                    GeneratedQuestion(
                        question_text=q["questionText"],
                        options=q["options"],
                        correct_answer=q["correctAnswer"],
                        explanation=q.get("explanation", ""),
                    )
                    for q in questions_raw
                    if isinstance(q, dict)
                    and "questionText" in q
                    and "options" in q
                    and "correctAnswer" in q
                ]
                if questions:
                    return GeneratedQuiz(questions=questions)
            except Exception:
                continue
    return None


def _parse_and_validate_explanation(raw: str | None) -> GeneratedExplanation | None:
    if not raw:
        return None
    candidates = [raw.strip()]
    unwrapped = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    if unwrapped != raw.strip():
        candidates.append(unwrapped)
    first = unwrapped.find("{")
    last = unwrapped.rfind("}")
    if first >= 0 and last > first:
        candidates.append(unwrapped[first: last + 1])

    for text in candidates:
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            continue
        for candidate in [obj, obj.get("explanation"), obj.get("data")] if isinstance(obj, dict) else [obj]:
            if not isinstance(candidate, dict):
                continue
            summary = candidate.get("summary") or candidate.get("Summary")
            key_points_raw = candidate.get("keyPoints") or candidate.get("key_points") or []
            if isinstance(summary, str) and len(summary) >= 20 and isinstance(key_points_raw, list) and key_points_raw:
                return GeneratedExplanation(
                    summary=summary,
                    key_points=[str(p) for p in key_points_raw if p],
                    why_it_matters=candidate.get("whyItMatters") or candidate.get("why_it_matters") or None,
                    example=candidate.get("example") or None,
                    common_mistakes=[str(m) for m in (candidate.get("commonMistakes") or candidate.get("common_mistakes") or []) if m] or None,
                )
    return None


def _parse_and_validate_answer(raw: str | None) -> str | None:
    if not raw:
        return None
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict) and isinstance(obj.get("answer"), str):
            return obj["answer"]
    except Exception:
        pass
    return None


# ── Three-tier generate (non-streaming) ───────────────────────────────────────

async def _generate_quiz_raw(prompt: str, log_ctx: str) -> GeneratedQuiz | None:
    # Tier 1 – Phi-4
    if settings.phi4_base_url and not await is_circuit_open("phi4"):
        raw = await phi4_generate(prompt)
        result = _parse_and_validate_quiz(raw)
        if result:
            await record_success("phi4")
            return result
        await record_failure("phi4")
        log.warning("Phi-4 failed for %s — trying Ollama", log_ctx)

    # Tier 2 – Ollama
    if not await is_circuit_open("ollama"):
        raw = await ollama_generate(prompt)
        result = _parse_and_validate_quiz(raw)
        if result:
            await record_success("ollama")
            return result
        await record_failure("ollama")
        log.warning("Ollama failed for %s — trying Gemini", log_ctx)

    # Tier 3 – Gemini
    raw = await gemini_generate(prompt)
    result = _parse_and_validate_quiz(raw)
    if result:
        return result
    log.warning("All providers failed for %s", log_ctx)
    return None


async def _generate_explanation_raw(prompt: str, log_ctx: str) -> GeneratedExplanation | None:
    if settings.phi4_base_url and not await is_circuit_open("phi4"):
        raw = await phi4_generate(prompt)
        result = _parse_and_validate_explanation(raw)
        if result:
            await record_success("phi4")
            return result
        await record_failure("phi4")

    if not await is_circuit_open("ollama"):
        raw = await ollama_generate(prompt)
        result = _parse_and_validate_explanation(raw)
        if result:
            await record_success("ollama")
            return result
        await record_failure("ollama")

    raw = await gemini_generate(prompt)
    return _parse_and_validate_explanation(raw)


async def _generate_answer_raw(prompt: str) -> str | None:
    if settings.phi4_base_url and not await is_circuit_open("phi4"):
        raw = await phi4_generate(prompt)
        result = _parse_and_validate_answer(raw)
        if result:
            await record_success("phi4")
            return result
        await record_failure("phi4")

    if not await is_circuit_open("ollama"):
        raw = await ollama_generate(prompt)
        result = _parse_and_validate_answer(raw)
        if result:
            await record_success("ollama")
            return result
        await record_failure("ollama")

    raw = await gemini_generate(prompt)
    return _parse_and_validate_answer(raw)


# ── Public non-streaming API ───────────────────────────────────────────────────

async def generate_quiz(input_data: NodeContextInput) -> GeneratedQuiz | None:
    familiarity = input_data.learner_context.familiarity_level if input_data.learner_context else None
    is_remedial = bool(input_data.weak_areas)

    key = (
        remedial_quiz_key(input_data.node_id, input_data.weak_areas or [])
        if is_remedial
        else quiz_key(input_data.node_id, input_data.adapted_difficulty, familiarity)
    )
    ttl = REMEDIAL_QUIZ_TTL if is_remedial else QUIZ_TTL

    cached = await get_cached(key)
    if cached:
        return GeneratedQuiz(**cached)

    # Reuse cached explanation to ground the quiz
    cached_exp_raw = await get_cached(explanation_key(input_data.node_id, familiarity))
    cached_exp = ExplanationContext(**cached_exp_raw) if cached_exp_raw else None

    prompt = build_quiz_prompt(input_data, explanation=cached_exp)
    result = await _generate_quiz_raw(prompt, f"quiz:{input_data.node_id}")
    if not result:
        return None

    await set_cache(key, result.model_dump(), ttl)
    return result


async def generate_explanation(input_data: NodeContextInput) -> GeneratedExplanation | None:
    familiarity = input_data.learner_context.familiarity_level if input_data.learner_context else None
    key = explanation_key(input_data.node_id, familiarity)

    cached = await get_cached(key)
    if cached:
        return GeneratedExplanation(**cached)

    prompt = build_explanation_prompt(input_data)
    result = await _generate_explanation_raw(prompt, f"explanation:{input_data.node_id}")
    if not result:
        return None

    await set_cache(key, result.model_dump(), EXPLANATION_TTL)
    return result


async def ask_question(input_data: AskQuestionInput) -> str | None:
    prompt = build_ask_prompt(input_data)
    return await _generate_answer_raw(prompt)


async def generate_micro_quiz(input_data: NodeContextInput) -> GeneratedQuiz | None:
    key = micro_quiz_key(input_data.node_id)
    cached = await get_cached(key)
    if cached:
        return GeneratedQuiz(**cached)

    prompt = build_micro_quiz_prompt(input_data)
    result = await _generate_quiz_raw(prompt, f"micro-quiz:{input_data.node_id}")
    if not result:
        return None

    await set_cache(key, result.model_dump(), MICRO_QUIZ_TTL)
    return result


# ── Helpers for stream backfill ────────────────────────────────────────────────

def _format_explanation_as_text(exp: GeneratedExplanation) -> str:
    lines = ["[SUMMARY]", exp.summary]
    if exp.why_it_matters:
        lines.extend(["", "[WHY_IT_MATTERS]", exp.why_it_matters])
    lines.extend(["", "[KEY_POINTS]"])
    for p in exp.key_points:
        lines.append(f"- {p}")
    if exp.example:
        lines.extend(["", "[EXAMPLE]", exp.example])
    if exp.common_mistakes:
        lines.extend(["", "[COMMON_MISTAKES]"])
        for m in exp.common_mistakes:
            lines.append(f"- {m}")
    return "\n".join(lines)


def _parse_streamed_text(text: str) -> GeneratedExplanation | None:
    import re
    summary_m  = re.search(r"\[SUMMARY\]([\s\S]*?)(?=\[WHY_IT_MATTERS\]|\[KEY_POINTS\]|\[EXAMPLE\]|\[COMMON_MISTAKES\]|$)", text)
    why_m      = re.search(r"\[WHY_IT_MATTERS\]([\s\S]*?)(?=\[KEY_POINTS\]|\[EXAMPLE\]|\[COMMON_MISTAKES\]|$)", text)
    points_m   = re.search(r"\[KEY_POINTS\]([\s\S]*?)(?=\[EXAMPLE\]|\[COMMON_MISTAKES\]|$)", text)
    example_m  = re.search(r"\[EXAMPLE\]([\s\S]*?)(?=\[COMMON_MISTAKES\]|$)", text)
    mistakes_m = re.search(r"\[COMMON_MISTAKES\]([\s\S]*?)$", text)

    summary = summary_m.group(1).strip() if summary_m else ""
    why_it_matters = why_m.group(1).strip() if why_m else None
    key_points = [
        ln.lstrip("- ").strip()
        for ln in (points_m.group(1) if points_m else "").splitlines()
        if ln.strip().startswith("-")
    ]
    example = example_m.group(1).strip() if example_m else None
    mistakes = [
        ln.lstrip("- ").strip()
        for ln in (mistakes_m.group(1) if mistakes_m else "").splitlines()
        if ln.strip().startswith("-")
    ] or None

    if summary and key_points:
        return GeneratedExplanation(
            summary=summary,
            why_it_matters=why_it_matters or None,
            key_points=key_points,
            example=example or None,
            common_mistakes=mistakes,
        )
    return None


async def _backfill_explanation_cache(node_id: str, familiarity: str | None, text: str) -> None:
    exp = _parse_streamed_text(text)
    if exp:
        await set_cache(explanation_key(node_id, familiarity), exp.model_dump(), EXPLANATION_TTL)


# ── Streaming API ──────────────────────────────────────────────────────────────

async def stream_explanation(input_data: NodeContextInput) -> AsyncIterator[str]:
    familiarity = input_data.learner_context.familiarity_level if input_data.learner_context else None
    key = explanation_key(input_data.node_id, familiarity)

    # Cache hit — emit everything at once
    cached = await get_cached(key)
    if cached:
        yield _format_explanation_as_text(GeneratedExplanation(**cached))
        return

    prompt = build_stream_explanation_prompt(input_data)
    collected: list[str] = []

    # Tier 0 – Phi-4 streaming (primary, zero-cost GPU)
    if settings.phi4_base_url and not await is_circuit_open("phi4"):
        try:
            async for token in phi4_stream(prompt):
                collected.append(token)
                yield token
            if collected:
                await record_success("phi4")
                text = "".join(collected)
                asyncio.create_task(_backfill_explanation_cache(input_data.node_id, familiarity, text))
                return
            await record_failure("phi4")
        except Exception as exc:
            await record_failure("phi4")
            log.warning("Phi-4 stream failed for %s: %s", input_data.node_id, exc)
            if collected:
                return  # partial output already sent
            collected.clear()

    # Tier 1 – Ollama streaming
    if not await is_circuit_open("ollama"):
        try:
            async for token in ollama_stream(prompt):
                collected.append(token)
                yield token
            if collected:
                await record_success("ollama")
                text = "".join(collected)
                asyncio.create_task(_backfill_explanation_cache(input_data.node_id, familiarity, text))
                return
            await record_failure("ollama")
        except Exception as exc:
            await record_failure("ollama")
            log.warning("Ollama stream failed for %s: %s", input_data.node_id, exc)
            if collected:
                return  # partial output already sent — can't fall back cleanly
            collected.clear()

    # Tier 2 – Gemini streaming
    if settings.gemini_api_key:
        try:
            async for token in gemini_stream(prompt):
                collected.append(token)
                yield token
            if collected:
                text = "".join(collected)
                asyncio.create_task(_backfill_explanation_cache(input_data.node_id, familiarity, text))
                return
        except Exception as exc:
            log.warning("Gemini stream failed for %s: %s", input_data.node_id, exc)
            if collected:
                return

    # Tier 3 – Non-streaming burst fallback
    log.warning("All stream providers failed for %s — using burst", input_data.node_id)
    result = await _generate_explanation_raw(build_explanation_prompt(input_data), f"explanation:{input_data.node_id}")
    if not result:
        raise RuntimeError("All explanation providers failed")
    await set_cache(key, result.model_dump(), EXPLANATION_TTL)
    yield _format_explanation_as_text(result)


async def stream_ask_question(input_data: AskQuestionInput) -> AsyncIterator[str]:
    prompt = build_stream_ask_prompt(input_data)
    collected: list[str] = []

    # Tier 0 – Phi-4 streaming (primary, zero-cost GPU)
    if settings.phi4_base_url and not await is_circuit_open("phi4"):
        try:
            async for token in phi4_stream(prompt):
                collected.append(token)
                yield token
            if collected:
                await record_success("phi4")
                return
            await record_failure("phi4")
        except Exception as exc:
            await record_failure("phi4")
            log.warning("Phi-4 ask-stream failed for %s: %s", input_data.node_id, exc)
            if collected:
                return
            collected.clear()

    # Tier 1 – Ollama streaming
    if not await is_circuit_open("ollama"):
        try:
            async for token in ollama_stream(prompt):
                collected.append(token)
                yield token
            if collected:
                await record_success("ollama")
                return
            await record_failure("ollama")
        except Exception as exc:
            await record_failure("ollama")
            log.warning("Ollama ask-stream failed for %s: %s", input_data.node_id, exc)
            if collected:
                return
            collected.clear()

    # Tier 2 – Gemini streaming
    if settings.gemini_api_key:
        try:
            async for token in gemini_stream(prompt):
                collected.append(token)
                yield token
            if collected:
                return
        except Exception as exc:
            log.warning("Gemini ask-stream failed for %s: %s", input_data.node_id, exc)
            if collected:
                return

    # Tier 3 – Burst fallback
    log.warning("All stream providers failed for ask %s — using burst", input_data.node_id)
    answer = await ask_question(input_data)
    if not answer:
        raise RuntimeError("All ask providers failed")
    yield answer
