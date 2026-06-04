import logging
import logging.config

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import settings
from app.routers.ai_router import router as ai_router
from app.routers.health_router import router as health_router

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

app = FastAPI(
    title="Yeneta AI Service",
    version="2.0.0",
    description="LLM generation with three-tier fallback, Redis caching, and SSE streaming.",
    # Mount docs under the same prefix Nginx proxies to (/docs/ai/)
    # so the Swagger UI can resolve /openapi.json correctly through the proxy.
    docs_url="/docs/ai",
    redoc_url="/docs/ai/redoc",
    openapi_url="/docs/ai/openapi.json",
)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only compress non-SSE routes — GZip on event-stream breaks token delivery.
# FastAPI's built-in GZipMiddleware skips responses with Content-Type: text/event-stream.
app.add_middleware(GZipMiddleware, minimum_size=1024)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(health_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
