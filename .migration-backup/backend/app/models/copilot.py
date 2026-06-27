"""AI Copilot thread and message models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

COPILOT_ROLES = ("user", "assistant", "tool")


class CopilotThread(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "copilot_thread"

    project_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(240), default="New conversation", nullable=False)

    messages: Mapped[list["CopilotMessage"]] = relationship(
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="CopilotMessage.created_at",
    )


class CopilotMessage(UUIDMixin, Base):
    __tablename__ = "copilot_message"

    thread_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("copilot_thread.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    citations: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    thread: Mapped["CopilotThread"] = relationship(back_populates="messages")
