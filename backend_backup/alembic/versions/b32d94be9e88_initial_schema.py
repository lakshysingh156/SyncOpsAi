"""initial schema

Revision ID: b32d94be9e88
Revises: 
Create Date: 2026-06-03 16:01:48.746839

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b32d94be9e88'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Required for the `embedding.embedding` vector column and similarity search.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table('project',
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('slug', sa.String(length=120), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slug')
    )
    op.create_table('api_key',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('key_hash', sa.String(length=128), nullable=False),
    sa.Column('prefix', sa.String(length=16), nullable=False),
    sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key_hash')
    )
    op.create_table('copilot_thread',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('title', sa.String(length=240), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('embedding',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('source_type', sa.String(length=30), nullable=False),
    sa.Column('source_id', sa.String(length=64), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=768), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_embedding_source', 'embedding', ['source_type', 'source_id'], unique=False)
    op.create_table('service',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('language', sa.String(length=60), nullable=True),
    sa.Column('owner_team', sa.String(length=120), nullable=True),
    sa.Column('tier', sa.String(length=20), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('project_id', 'name', name='uq_service_project_name')
    )
    op.create_index(op.f('ix_service_project_id'), 'service', ['project_id'], unique=False)
    op.create_table('alert_rule',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=True),
    sa.Column('name', sa.String(length=160), nullable=False),
    sa.Column('enabled', sa.Boolean(), nullable=False),
    sa.Column('signal', sa.String(length=30), nullable=False),
    sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('severity', sa.String(length=10), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['service_id'], ['service.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('copilot_message',
    sa.Column('thread_id', sa.UUID(), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('tool_calls', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('citations', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['thread_id'], ['copilot_thread.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_copilot_message_thread_id'), 'copilot_message', ['thread_id'], unique=False)
    op.create_table('deployment',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('environment', sa.String(length=20), nullable=False),
    sa.Column('version', sa.String(length=120), nullable=False),
    sa.Column('commit_sha', sa.String(length=64), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('deployed_by', sa.String(length=120), nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['service_id'], ['service.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_deployment_service_started', 'deployment', ['service_id', 'started_at'], unique=False)
    op.create_table('log',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    sa.Column('severity', sa.String(length=10), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('trace_id', sa.String(length=64), nullable=True),
    sa.Column('host', sa.String(length=120), nullable=True),
    sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['service_id'], ['service.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_log_service_ts', 'log', ['service_id', 'timestamp'], unique=False)
    op.create_index('ix_log_severity', 'log', ['severity'], unique=False)
    # Full-text search index over log messages.
    op.execute(
        "CREATE INDEX ix_log_message_fts ON log "
        "USING gin (to_tsvector('english', message))"
    )
    op.create_table('metric_point',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('type', sa.String(length=20), nullable=False),
    sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    sa.Column('value', sa.Float(), nullable=False),
    sa.Column('labels', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['service_id'], ['service.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_metric_service_name_ts', 'metric_point', ['service_id', 'name', 'timestamp'], unique=False)
    op.create_table('incident',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=True),
    sa.Column('alert_rule_id', sa.UUID(), nullable=True),
    sa.Column('title', sa.String(length=240), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('severity', sa.String(length=10), nullable=False),
    sa.Column('summary_md', sa.Text(), nullable=True),
    sa.Column('root_cause_md', sa.Text(), nullable=True),
    sa.Column('assignee', sa.String(length=120), nullable=True),
    sa.Column('opened_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['alert_rule_id'], ['alert_rule.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['service_id'], ['service.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_incident_status_opened', 'incident', ['status', 'opened_at'], unique=False)
    op.create_table('incident_event',
    sa.Column('incident_id', sa.UUID(), nullable=False),
    sa.Column('kind', sa.String(length=30), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('actor', sa.String(length=120), nullable=True),
    sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['incident_id'], ['incident.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_incident_event_incident_id'), 'incident_event', ['incident_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_incident_event_incident_id'), table_name='incident_event')
    op.drop_table('incident_event')
    op.drop_index('ix_incident_status_opened', table_name='incident')
    op.drop_table('incident')
    op.drop_index('ix_metric_service_name_ts', table_name='metric_point')
    op.drop_table('metric_point')
    op.drop_index('ix_log_severity', table_name='log')
    op.drop_index('ix_log_service_ts', table_name='log')
    op.drop_table('log')
    op.drop_index('ix_deployment_service_started', table_name='deployment')
    op.drop_table('deployment')
    op.drop_index(op.f('ix_copilot_message_thread_id'), table_name='copilot_message')
    op.drop_table('copilot_message')
    op.drop_table('alert_rule')
    op.drop_index(op.f('ix_service_project_id'), table_name='service')
    op.drop_table('service')
    op.drop_index('ix_embedding_source', table_name='embedding')
    op.drop_table('embedding')
    op.drop_table('copilot_thread')
    op.drop_table('api_key')
    op.drop_table('project')
    # ### end Alembic commands ###
