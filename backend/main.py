"""MIRAI PATH FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import __version__
from backend.api.routes import router
from backend.config.settings import get_settings

logger = logging.getLogger("mirai_path")


def _browser_origins(frontend_url: str) -> list[str]:
    """Allow the configured site on both localhost and 127.0.0.1."""
    origin = frontend_url.rstrip("/") or "http://localhost:3000"
    origins = {origin}
    if "localhost" in origin:
        origins.add(origin.replace("localhost", "127.0.0.1"))
    if "127.0.0.1" in origin:
        origins.add(origin.replace("127.0.0.1", "localhost"))
    return sorted(origins)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Configure logging and record a secret-free startup line."""
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logger.info(
        "MIRAI PATH starting version=%s provider=%s openai_key_set=%s gemini_key_set=%s",
        __version__,
        settings.llm_provider,
        settings.secret_configured(settings.openai_api_key),
        settings.secret_configured(settings.gemini_api_key),
    )
    yield
    logger.info("MIRAI PATH stopped")


def create_app() -> FastAPI:
    """Build the FastAPI app. Safe to import without external credentials."""
    settings = get_settings()
    app = FastAPI(
        title="MIRAI PATH",
        description=(
            "MIRAI PATH = FUTURE + PATH. "
            "An AI-powered job research and application agent. "
            "Mirai (未来) means Future."
        ),
        version=__version__,
        lifespan=lifespan,
        servers=[{"url": settings.backend_url, "description": "Configured backend"}],
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_browser_origins(settings.frontend_url),
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Accept", "X-Session-Id"],
    )
    app.include_router(router)
    return app


app = create_app()
