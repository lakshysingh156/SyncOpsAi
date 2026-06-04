"""Service repository for CRUD operations on Service model."""

import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate


class ServiceRepository:
    """Encapsulates Service database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_service(
        self, project_id: uuid.UUID, schema: ServiceCreate
    ) -> ServiceRead:
        """
        Create a new service.

        Raises:
            ValueError: If service name already exists for this project.
        """
        service = Service(
            project_id=project_id,
            name=schema.name,
            language=schema.language,
            owner_team=schema.owner_team,
            tier=schema.tier,
            description=schema.description,
        )
        self.db.add(service)
        try:
            await self.db.flush()
            await self.db.refresh(service)
        except IntegrityError as e:
            await self.db.rollback()
            if "uq_service_project_name" in str(e):
                raise ValueError(
                    f"Service with name '{schema.name}' already exists in this project."
                ) from e
            raise

        return ServiceRead.model_validate(service)

    async def get_service(self, service_id: uuid.UUID) -> ServiceRead | None:
        """Get a service by ID."""
        stmt = select(Service).where(Service.id == service_id)
        result = await self.db.execute(stmt)
        service = result.scalar_one_or_none()
        if service:
            return ServiceRead.model_validate(service)
        return None

    async def list_services(self, project_id: uuid.UUID) -> list[ServiceRead]:
        """List all services for a project."""
        stmt = select(Service).where(Service.project_id == project_id).order_by(Service.name)
        result = await self.db.execute(stmt)
        services = result.scalars().all()
        return [ServiceRead.model_validate(s) for s in services]

    async def update_service(
        self, service_id: uuid.UUID, schema: ServiceUpdate
    ) -> ServiceRead | None:
        """
        Update a service (all fields optional).

        Returns:
            Updated ServiceRead or None if service not found.

        Raises:
            ValueError: If new name violates unique constraint.
        """
        stmt = select(Service).where(Service.id == service_id)
        result = await self.db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            return None

        # Update only non-None fields
        if schema.name is not None:
            service.name = schema.name
        if schema.language is not None:
            service.language = schema.language
        if schema.owner_team is not None:
            service.owner_team = schema.owner_team
        if schema.tier is not None:
            service.tier = schema.tier
        if schema.description is not None:
            service.description = schema.description

        try:
            await self.db.flush()
            await self.db.refresh(service)
        except IntegrityError as e:
            await self.db.rollback()
            if "uq_service_project_name" in str(e):
                raise ValueError(
                    f"Service with name '{schema.name}' already exists in this project."
                ) from e
            raise

        return ServiceRead.model_validate(service)

    async def delete_service(self, service_id: uuid.UUID) -> bool:
        """
        Delete a service.

        Returns:
            True if deleted, False if not found.
        """
        stmt = select(Service).where(Service.id == service_id)
        result = await self.db.execute(stmt)
        service = result.scalar_one_or_none()
        if not service:
            return False

        await self.db.delete(service)
        return True

    async def commit(self) -> None:
        """Commit the current transaction."""
        await self.db.commit()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self.db.rollback()
