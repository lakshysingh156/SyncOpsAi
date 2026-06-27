"""FastAPI router for Metrics operations."""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.metric import MetricPoint
from app.models.service import Service
from app.schemas.metric import MetricCreate, MetricRead, MetricSummary
from app.services.metric import MetricRepository

logger = logging.getLogger("syncops.metrics")

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

# MVP: Single hardcoded project
DEFAULT_PROJECT_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")


async def get_metric_repository(db: AsyncSession = Depends(get_db)) -> MetricRepository:
    """Dependency injection for MetricRepository."""
    return MetricRepository(db)


@router.get("", response_model=list[MetricRead], status_code=status.HTTP_200_OK)
async def list_metrics(
    repo: MetricRepository = Depends(get_metric_repository),
) -> list[MetricRead]:
    """
    List all metrics for the project.

    Returns:
        List of all metrics ordered by timestamp.
    """
    try:
        metrics = await repo.list_metrics(DEFAULT_PROJECT_ID)
        return metrics
    except Exception as e:
        logger.error("Error listing metrics: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list metrics",
        ) from e


@router.get("/service/{service_id}", response_model=list[MetricRead], status_code=status.HTTP_200_OK)
async def get_service_metrics(
    service_id: uuid.UUID,
    metric_type: Optional[str] = None,
    repo: MetricRepository = Depends(get_metric_repository),
) -> list[MetricRead]:
    """
    Get metrics for a specific service.

    Args:
        service_id: Service UUID
        metric_type: Optional filter by metric type (latency, error_rate, throughput)

    Returns:
        List of metrics for the service.
    """
    try:
        if metric_type:
            metrics = await repo.get_metrics_by_type(service_id, metric_type)
        else:
            metrics = await repo.get_service_metrics(service_id)
        return metrics
    except Exception as e:
        logger.error("Error getting service metrics: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get service metrics",
        ) from e


@router.get("/summary", response_model=MetricSummary, status_code=status.HTTP_200_OK)
async def get_metrics_summary(
    db: AsyncSession = Depends(get_db),
) -> MetricSummary:
    """
    Get summary statistics for all metrics.

    Returns:
        Aggregated metrics summary.
    """
    try:
        # Average latency
        latency_stmt = select(func.avg(MetricPoint.value)).where(
            (MetricPoint.project_id == DEFAULT_PROJECT_ID) & (MetricPoint.type == "latency")
        )
        latency_result = await db.execute(latency_stmt)
        avg_latency = float(latency_result.scalar() or 0)

        # Average error rate
        error_stmt = select(func.avg(MetricPoint.value)).where(
            (MetricPoint.project_id == DEFAULT_PROJECT_ID) & (MetricPoint.type == "error_rate")
        )
        error_result = await db.execute(error_stmt)
        avg_error_rate = float(error_result.scalar() or 0)

        # Average throughput
        throughput_stmt = select(func.avg(MetricPoint.value)).where(
            (MetricPoint.project_id == DEFAULT_PROJECT_ID) & (MetricPoint.type == "throughput")
        )
        throughput_result = await db.execute(throughput_stmt)
        avg_throughput = float(throughput_result.scalar() or 0)

        # Total services with metrics
        services_stmt = select(func.count(func.distinct(MetricPoint.service_id))).where(
            MetricPoint.project_id == DEFAULT_PROJECT_ID
        )
        services_result = await db.execute(services_stmt)
        total_services = int(services_result.scalar() or 0)

        return MetricSummary(
            avg_latency=round(avg_latency, 2),
            avg_error_rate=round(avg_error_rate, 2),
            avg_throughput=round(avg_throughput, 2),
            total_services=total_services,
        )
    except Exception as e:
        logger.error("Error getting metrics summary: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get metrics summary",
        ) from e


@router.post("/generate-demo-data", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_demo_metrics(
    db: AsyncSession = Depends(get_db),
    repo: MetricRepository = Depends(get_metric_repository),
) -> dict:
    """
    Generate demo metrics for all services in the project.

    Returns:
        Count of metrics generated.
    """
    try:
        # Get all services in the project
        services_stmt = select(Service).where(Service.project_id == DEFAULT_PROJECT_ID)
        result = await db.execute(services_stmt)
        services = result.scalars().all()

        if not services:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No services found in project",
            )

        total_generated = 0
        for service in services:
            generated = await repo.generate_demo_metrics(service.id, DEFAULT_PROJECT_ID)
            total_generated += generated

        await db.commit()

        logger.info("Generated %d metrics for %d services", total_generated, len(services))
        return {
            "metrics_generated": total_generated,
            "services_count": len(services),
            "message": f"Generated {total_generated} demo metrics",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error generating demo metrics: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate demo metrics",
        ) from e
