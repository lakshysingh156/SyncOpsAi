"""FastAPI application entrypoint for SyncOps AI.

Milestone 1 wires up the app factory, config, CORS, and a health router.
Domain routers (ingest, services, logs, metrics, incidents, deployments,
copilot) are mounted in subsequent milestones.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("syncops")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s (%s)", settings.app_name, settings.environment)
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="AI-native observability & operational-intelligence platform.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)

    return app


app = create_app()
