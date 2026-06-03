"""Structured log model with full-text search support."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin

LOG_SEVERITIES = ("debug", "info", "warn", "error", "fatal")


class Log(UUIDMixin, Base):
    __tablename__ = "log"
    __table_args__ = (
        Index("ix_log_service_ts", "service_id", "timestamp"),
        Index("ix_log_severity", "severity"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("service.id", ondelete="CASCADE"),
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    severity: Mapped[str] = mapped_column(String(10), default="info", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    host: Mapped[str | None] = mapped_column(String(120), nullable=True)
    attributes: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
