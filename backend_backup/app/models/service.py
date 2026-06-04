"""Service catalog model."""

import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin

SERVICE_TIERS = ("critical", "high", "normal")


class Service(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "service"
    __table_args__ = (UniqueConstraint("project_id", "name", name="uq_service_project_name"),)

    project_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    language: Mapped[str | None] = mapped_column(String(60), nullable=True)
    owner_team: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tier: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
