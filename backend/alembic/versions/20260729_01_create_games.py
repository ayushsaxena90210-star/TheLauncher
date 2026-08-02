"""Create games table.

Revision ID: 20260729_01
Revises:
Create Date: 2026-07-29
"""

from alembic import op
import sqlalchemy as sa


revision = "20260729_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "games",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("executable_path", sa.String(length=2048), nullable=False),
        sa.Column("install_path", sa.String(length=2048), nullable=True),
        sa.Column("cover_path", sa.String(length=2048), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("executable_path"),
    )


def downgrade() -> None:
    op.drop_table("games")
