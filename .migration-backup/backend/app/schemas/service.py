"""Pydantic schemas for Service CRUD."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    """Request schema for creating a service."""

    name: str = Field(..., min_length=1, max_length=120, description="Service name")
    language: str | None = Field(
        None, max_length=60, description="Programming language (e.g., Python, Go, Node.js)"
    )
    owner_team: str | None = Field(None, max_length=120, description="Team that owns the service")
    tier: str = Field(
        "normal",
        description="Service tier: 'normal', 'high', or 'critical'",
    )
    description: str | None = Field(None, max_length=500, description="Service description")


class ServiceUpdate(BaseModel):
    """Request schema for updating a service (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=120, description="Service name")
    language: str | None = Field(None, max_length=60, description="Programming language")
    owner_team: str | None = Field(None, max_length=120, description="Team that owns the service")
    tier: str | None = Field(None, description="Service tier")
    description: str | None = Field(None, max_length=500, description="Service description")


class ServiceRead(BaseModel):
    """Response schema for service queries."""

    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    language: str | None
    owner_team: str | None
    tier: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
