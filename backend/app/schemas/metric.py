"""Pydantic schemas for metric operations."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MetricCreate(BaseModel):
    """Schema for creating a new metric."""

    metric_type: str = Field(..., description="Type: latency, error_rate, or throughput")
    value: float = Field(..., ge=0, description="Metric value")
    timestamp: datetime = Field(..., description="ISO 8601 timestamp")


from pydantic import BaseModel, Field, ConfigDict

class MetricRead(BaseModel):
    id: UUID
    service_id: UUID

    metric_type: str = Field(alias="type")

    value: float
    timestamp: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class MetricSummary(BaseModel):
    """Summary statistics for metrics."""

    avg_latency: float = Field(..., description="Average latency in ms")
    avg_error_rate: float = Field(..., description="Average error rate as percentage")
    avg_throughput: float = Field(..., description="Average throughput in req/min")
    total_services: int = Field(..., description="Number of services with metrics")
