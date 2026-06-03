"""Deployment model — first-class for RCA correlation."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin

DEPLOYMENT_STATUSES = ("success", "failed", "rolled_back")
ENVIRONMENTS = ("prod", "staging", "dev")


class Deployment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "deployment"
    __table_args__ = (
        Index("ix_deployment_service_started", "service_id", "started_at"),
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
    environment: Mapped[str] = mapped_column(String(20), default="prod", nullable=False)
    version: Mapped[str] = mapped_column(String(120), nullable=False)
    commit_sha: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="success", nullable=False)
    deployed_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    meta: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
