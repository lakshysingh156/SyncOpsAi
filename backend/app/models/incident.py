"""Incident and incident-timeline models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

INCIDENT_STATUSES = ("open", "acknowledged", "resolved")
INCIDENT_SEVERITIES = ("sev1", "sev2", "sev3")
INCIDENT_EVENT_KINDS = (
    "detected",
    "status_change",
    "note",
    "deploy_link",
    "ai_analysis",
)


class Incident(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "incident"
    __table_args__ = (Index("ix_incident_status_opened", "status", "opened_at"),)

    project_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("service.id", ondelete="SET NULL"),
        nullable=True,
    )
    alert_rule_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("alert_rule.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    severity: Mapped[str] = mapped_column(String(10), default="sev2", nullable=False)
    summary_md: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_cause_md: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignee: Mapped[str | None] = mapped_column(String(120), nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    events: Mapped[list["IncidentEvent"]] = relationship(
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="IncidentEvent.created_at",
    )


class IncidentEvent(UUIDMixin, Base):
    __tablename__ = "incident_event"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("incident.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(30), default="note", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    actor: Mapped[str | None] = mapped_column(String(120), nullable=True)
    meta: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    incident: Mapped["Incident"] = relationship(back_populates="events")
