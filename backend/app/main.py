"""FastAPI application entrypoint for SyncOps AI.

Milestone 1 wires up the app factory, config, CORS, and a health router.
Domain routers (ingest, services, logs, metrics, incidents, deployments,
copilot) are mounted in subsequent milestones.
"""

import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.project import Project
from app.routers import health, services

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("syncops")

# MVP: Single hardcoded default project UUID.
# In production, extract project ID from JWT claims per tenant.
DEFAULT_PROJECT_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
DEFAULT_PROJECT_SLUG = "default"
DEFAULT_PROJECT_NAME = "Default Project"


async def ensure_default_project() -> None:
    """
    Ensure the default project exists in the database.

    Creates the default project if it doesn't exist. This runs on every
    application startup to ensure consistency without requiring manual setup.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Check if project already exists
            stmt = select(Project).where(Project.id == DEFAULT_PROJECT_ID)
            result = await session.execute(stmt)
            project = result.scalar_one_or_none()

            if project is None:
                # Create default project
                project = Project(
                    id=DEFAULT_PROJECT_ID,
                    name=DEFAULT_PROJECT_NAME,
                    slug=DEFAULT_PROJECT_SLUG,
                )
                session.add(project)
                await session.commit()
                logger.info("Created default project: %s (id=%s)", DEFAULT_PROJECT_NAME, DEFAULT_PROJECT_ID)
            else:
                logger.info("Default project already exists: %s", DEFAULT_PROJECT_NAME)
        except Exception as e:
            await session.rollback()
            logger.error("Failed to ensure default project: %s", str(e))
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s (%s)", settings.app_name, settings.environment)
    
    # Ensure default project exists
    await ensure_default_project()
    
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
    app.include_router(services.router)

    return app


app = create_app()
