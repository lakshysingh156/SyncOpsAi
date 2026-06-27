"""FastAPI routers for all domain APIs."""

from app.routers import health,services, metrics

__all__ = [
    "health",
    "services",
    "metrics",
]
