"""FastAPI router for Service CRUD operations."""

import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate
from app.services.service import ServiceRepository

logger = logging.getLogger("syncops.services")

router = APIRouter(prefix="/api/services", tags=["services"])

# MVP: Single hardcoded project. In production, extract from JWT claims.
DEFAULT_PROJECT_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")


async def get_service_repository(db: AsyncSession = Depends(get_db)) -> ServiceRepository:
    """Dependency injection for ServiceRepository."""
    return ServiceRepository(db)


@router.get("", response_model=list[ServiceRead], status_code=status.HTTP_200_OK)
async def list_services(repo: ServiceRepository = Depends(get_service_repository)) -> list:
    """
    List all services for the project.

    Returns:
        List of all services.
    """
    try:
        services = await repo.list_services(DEFAULT_PROJECT_ID)
        return services
    except Exception as e:
        logger.error("Error listing services: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list services",
        ) from e


@router.get("/{service_id}", response_model=ServiceRead, status_code=status.HTTP_200_OK)
async def get_service(
    service_id: uuid.UUID,
    repo: ServiceRepository = Depends(get_service_repository),
) -> ServiceRead:
    """
    Get a service by ID.

    Args:
        service_id: The service UUID.

    Returns:
        The service details.

    Raises:
        404: If service not found.
    """
    try:
        service = await repo.get_service(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found",
            )
        return service
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting service %s: %s", service_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service",
        ) from e


@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
async def create_service(
    schema: ServiceCreate,
    repo: ServiceRepository = Depends(get_service_repository),
) -> ServiceRead:
    """
    Create a new service.

    Args:
        schema: Service creation data.

    Returns:
        The created service.

    Raises:
        400: If validation fails or name already exists.
        500: If database error occurs.
    """
    try:
        service = await repo.create_service(DEFAULT_PROJECT_ID, schema)
        await repo.commit()
        return service
    except ValueError as e:
        # Name uniqueness violation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        await repo.rollback()
        logger.error("Error creating service: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create service",
        ) from e


@router.put("/{service_id}", response_model=ServiceRead, status_code=status.HTTP_200_OK)
async def update_service(
    service_id: uuid.UUID,
    schema: ServiceUpdate,
    repo: ServiceRepository = Depends(get_service_repository),
) -> ServiceRead:
    """
    Update a service.

    Args:
        service_id: The service UUID.
        schema: Partial update data (all fields optional).

    Returns:
        The updated service.

    Raises:
        404: If service not found.
        400: If validation fails or name already exists.
        500: If database error occurs.
    """
    try:
        service = await repo.update_service(service_id, schema)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found",
            )
        await repo.commit()
        return service
    except HTTPException:
        raise
    except ValueError as e:
        # Name uniqueness violation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        await repo.rollback()
        logger.error("Error updating service %s: %s", service_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update service",
        ) from e


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: uuid.UUID,
    repo: ServiceRepository = Depends(get_service_repository),
) -> None:
    """
    Delete a service.

    Args:
        service_id: The service UUID.

    Raises:
        404: If service not found.
        500: If database error occurs.
    """
    try:
        deleted = await repo.delete_service(service_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found",
            )
        await repo.commit()
    except HTTPException:
        raise
    except Exception as e:
        await repo.rollback()
        logger.error("Error deleting service %s: %s", service_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete service",
        ) from e
