import json
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app import service
from app.cache import invalidate_remedial_cache
from app.circuit_breaker import get_circuit_state
from app.clients.ollama_client import is_ollama_reachable
from app.clients.gemini_client import is_gemini_configured
from app.clients.phi4_client import is_phi4_reachable
from app.config import settings
from app.schemas import AskQuestionInput, NodeContextInput

router = APIRouter(prefix="/ai", tags=["AI"])
log = logging.getLogger(__name__)

_SSE_HEADERS = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",  # tell Nginx not to buffer tokens
}


# ── Standard JSON endpoints ────────────────────────────────────────────────────

@router.post("/generate-quiz")
async def generate_quiz(body: NodeContextInput):
    quiz = await service.generate_quiz(body)
    return {"quiz": quiz.model_dump(by_alias=True) if quiz else None, "cached": False}


@router.post("/generate-explanation")
async def generate_explanation(body: NodeContextInput):
    explanation = await service.generate_explanation(body)
    return {"explanation": explanation.model_dump(by_alias=True) if explanation else None}


@router.post("/generate-micro-quiz")
async def generate_micro_quiz(body: NodeContextInput):
    quiz = await service.generate_micro_quiz(body)
    return {"quiz": quiz.model_dump(by_alias=True) if quiz else None}


@router.post("/ask-question")
async def ask_question(body: AskQuestionInput):
    answer = await service.ask_question(body)
    return {"answer": answer}


# ── SSE streaming endpoints ────────────────────────────────────────────────────

@router.post("/generate-explanation/stream")
async def stream_explanation(body: NodeContextInput, request: Request):
    async def event_gen():
        try:
            async for token in service.stream_explanation(body):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps({'t': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            log.error("stream_explanation error: %s", exc)
            yield f"data: {json.dumps({'error': 'Generation failed'})}\n\n"

    return StreamingResponse(event_gen(), headers=_SSE_HEADERS)


@router.post("/ask-question/stream")
async def stream_ask_question(body: AskQuestionInput, request: Request):
    async def event_gen():
        try:
            async for token in service.stream_ask_question(body):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps({'t': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            log.error("stream_ask_question error: %s", exc)
            yield f"data: {json.dumps({'error': 'Generation failed'})}\n\n"

    return StreamingResponse(event_gen(), headers=_SSE_HEADERS)


# ── Cache management ───────────────────────────────────────────────────────────

@router.delete("/cache/remedial/{node_id}")
async def invalidate_cache(node_id: str):
    deleted = await invalidate_remedial_cache(node_id)
    return {"deleted": deleted}


# ── Detailed health (per-provider state) ──────────────────────────────────────

@router.get("/health")
async def health_detail():
    phi4_up, ollama_up, phi4_cb, ollama_cb = (
        await is_phi4_reachable(),
        await is_ollama_reachable(),
        await get_circuit_state("phi4"),
        await get_circuit_state("ollama"),
    )
    return {
        "status": "ok",
        "providers": {
            "phi4": {
                "configured": bool(settings.phi4_base_url),
                "reachable": phi4_up,
                "url": settings.phi4_base_url or None,
                "circuit_breaker": phi4_cb,
            },
            "ollama": {
                "configured": True,
                "reachable": ollama_up,
                "circuit_breaker": ollama_cb,
            },
            "gemini": {
                "configured": is_gemini_configured(),
            },
        },
    }
