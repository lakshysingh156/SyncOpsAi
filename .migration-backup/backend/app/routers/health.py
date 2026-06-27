"""Health and readiness endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """Liveness probe."""
    return {"status": "ok", "app": settings.app_name, "version": "0.1.0"}


@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)) -> dict:
    """Readiness probe that verifies database connectivity."""
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
