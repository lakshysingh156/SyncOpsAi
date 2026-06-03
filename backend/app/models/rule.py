"""Alert rule model — evaluated by the scheduler to open incidents."""

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin

ALERT_SIGNALS = ("error_rate", "latency", "metric_threshold", "log_match")
SEVERITIES = ("sev1", "sev2", "sev3")


class AlertRule(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "alert_rule"

    project_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("service.id", ondelete="CASCADE"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    signal: Mapped[str] = mapped_column(String(30), nullable=False)
    # config: {metric, op, threshold, window, for, filters}
    config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    severity: Mapped[str] = mapped_column(String(10), default="sev2", nullable=False)
