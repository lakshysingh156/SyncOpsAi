"""Service layer for metric operations."""

from datetime import datetime, timedelta
import random
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.metric import MetricPoint
from app.schemas.metric import MetricCreate, MetricRead


class MetricRepository:
    """Repository for metric database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_metric(
        self,
        service_id: uuid.UUID,
        project_id: uuid.UUID,
        schema: MetricCreate,
        metric_type: str,
    ) -> MetricRead:
        """Create a new metric."""
        metric = MetricPoint(
            id=uuid.uuid4(),
            service_id=service_id,
            project_id=project_id,
            name=metric_type,
            type=metric_type,
            value=schema.value,
            timestamp=schema.timestamp,
            labels={},
        )
        self.db.add(metric)
        await self.db.flush()
        return MetricRead.model_validate(metric)

    async def list_metrics(self, project_id: uuid.UUID) -> list[MetricRead]:
        """Get all metrics for a project."""
        stmt = select(MetricPoint).where(MetricPoint.project_id == project_id).order_by(MetricPoint.timestamp.desc())
        result = await self.db.execute(stmt)
        metrics = result.scalars().all()
        return [MetricRead.model_validate(m) for m in metrics]

    async def get_service_metrics(
        self, service_id: uuid.UUID, limit: int = 1000
    ) -> list[MetricRead]:
        """Get metrics for a specific service."""
        stmt = (
            select(MetricPoint)
            .where(MetricPoint.service_id == service_id)
            .order_by(MetricPoint.timestamp.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        metrics = result.scalars().all()
        return [MetricRead.model_validate(m) for m in metrics]

    async def get_metrics_by_type(
        self, service_id: uuid.UUID, metric_type: str, hours: int = 24
    ) -> list[MetricRead]:
        """Get metrics of a specific type from the last N hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        stmt = (
            select(MetricPoint)
            .where(
                (MetricPoint.service_id == service_id)
                & (MetricPoint.type == metric_type)
                & (MetricPoint.timestamp >= cutoff)
            )
            .order_by(MetricPoint.timestamp.asc())
        )
        result = await self.db.execute(stmt)
        metrics = result.scalars().all()
        return [MetricRead.model_validate(m) for m in metrics]

    async def generate_demo_metrics(self, service_id: uuid.UUID, project_id: uuid.UUID) -> int:
        """Generate demo metrics for the last 24 hours."""
        now = datetime.utcnow()
        metrics_created = 0

        # Generate 24 data points (one per hour)
        for hours_ago in range(24, -1, -1):
            timestamp = now - timedelta(hours=hours_ago)

            # Latency: 50-400ms
            latency = random.uniform(50, 400)
            metric = MetricPoint(
                id=uuid.uuid4(),
                service_id=service_id,
                project_id=project_id,
                name="latency",
                type="latency",
                value=latency,
                timestamp=timestamp,
                labels={},
            )
            self.db.add(metric)
            metrics_created += 1

            # Error Rate: 0-10%
            error_rate = random.uniform(0, 10)
            metric = MetricPoint(
                id=uuid.uuid4(),
                service_id=service_id,
                project_id=project_id,
                name="error_rate",
                type="error_rate",
                value=error_rate,
                timestamp=timestamp,
                labels={},
            )
            self.db.add(metric)
            metrics_created += 1

            # Throughput: 100-5000 req/min
            throughput = random.uniform(100, 5000)
            metric = MetricPoint(
                id=uuid.uuid4(),
                service_id=service_id,
                project_id=project_id,
                name="throughput",
                type="throughput",
                value=throughput,
                timestamp=timestamp,
                labels={},
            )
            self.db.add(metric)
            metrics_created += 1

        await self.db.flush()
        return metrics_created
