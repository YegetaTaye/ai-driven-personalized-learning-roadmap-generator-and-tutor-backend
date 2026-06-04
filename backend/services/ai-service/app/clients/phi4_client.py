import asyncio
import json
from collections.abc import AsyncIterator

import httpx

from app.config import settings

# Short connect timeout; per-chunk read timeout reset each time a byte arrives
_TIMEOUT = httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0)
# If no real token arrives within this window, abort (covers SSE keepalive spam)
_FIRST_TOKEN_SECS = 20.0


async def phi4_generate(prompt: str) -> str | None:
    if not settings.phi4_base_url:
        return None
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=5.0, read=45.0, write=10.0, pool=5.0)) as client:
            resp = await client.post(
                f"{settings.phi4_base_url}/generate/text",
                data={"prompt": prompt, "max_new_tokens": "2048", "json_mode": "true"},
            )
            if not resp.is_success:
                return None
            return resp.json().get("response")
    except Exception:
        return None


async def phi4_stream(prompt: str) -> AsyncIterator[str]:
    """Stream tokens from the Phi-4 Kaggle endpoint (/generate/text/stream).

    The Kaggle endpoint emits either:
    - Plain text chunks (media_type=text/plain), or
    - SSE-formatted lines (data: "token"\\n\\n)

    Both formats are handled — only the raw token text is yielded.

    Two failure modes are guarded:
    1. Complete silence: httpx ReadTimeout fires after 30 s per network read.
    2. SSE keepalive spam (empty lines keep read-timeout alive but no real tokens
       arrive): a first-token deadline aborts the stream after _FIRST_TOKEN_SECS.
    """
    first_token_deadline = asyncio.get_event_loop().time() + _FIRST_TOKEN_SECS
    token_yielded = False

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{settings.phi4_base_url}/generate/text/stream",
            data={"prompt": prompt, "max_new_tokens": "2048"},
        ) as resp:
            resp.raise_for_status()
            buffer = ""
            async for raw_chunk in resp.aiter_text():
                buffer += raw_chunk
                lines = buffer.split("\n")
                buffer = lines.pop()  # keep incomplete trailing line
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    if line == "data: [DONE]":
                        return
                    if line.startswith("data: "):
                        payload = line[6:]
                        # Try to JSON-decode the token (server may quote strings)
                        try:
                            token = json.loads(payload)
                            if isinstance(token, str) and token:
                                token_yielded = True
                                yield token
                        except json.JSONDecodeError:
                            # Plain text payload — yield as-is
                            if payload:
                                token_yielded = True
                                yield payload
                    else:
                        # Plain text chunk (not SSE formatted)
                        if line:
                            token_yielded = True
                            yield line

                # Abort if we've been receiving data (keepalives) but no real tokens
                if not token_yielded and asyncio.get_event_loop().time() > first_token_deadline:
                    return


async def is_phi4_reachable() -> bool:
    if not settings.phi4_base_url:
        return False
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(f"{settings.phi4_base_url}/health")
            return resp.is_success
    except Exception:
        return False
