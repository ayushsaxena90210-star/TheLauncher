"""Add local settings and persisted scan roots for Phase 8.

Revision ID: 20260805_01
Revises: 20260804_01
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa

revision = "20260805_01"
down_revision = "20260804_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=100), primary_key=True),
        sa.Column("value_json", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "scan_roots",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("path", sa.String(length=2048), nullable=False, unique=True),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("scan_roots")
    op.drop_table("settings")
