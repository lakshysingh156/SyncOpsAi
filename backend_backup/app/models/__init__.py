"""ORM models for SyncOps AI.

Importing this package registers all models on the shared ``Base.metadata``
so Alembic autogenerate and ``create_all`` see every table.
"""

from app.models.api_key import ApiKey
from app.models.copilot import CopilotMessage, CopilotThread
from app.models.deployment import Deployment
from app.models.embedding import Embedding
from app.models.incident import Incident, IncidentEvent
from app.models.log import Log
from app.models.metric import MetricPoint
from app.models.project import Project
from app.models.rule import AlertRule
from app.models.service import Service

__all__ = [
    "AlertRule",
    "ApiKey",
    "CopilotMessage",
    "CopilotThread",
    "Deployment",
    "Embedding",
    "Incident",
    "IncidentEvent",
    "Log",
    "MetricPoint",
    "Project",
    "Service",
]
