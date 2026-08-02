"""Create game_sessions table.

Revision ID: 20260729_02
Revises: 20260729_01
Create Date: 2026-07-29
"""

from alembic import op
import sqlalchemy as sa


revision = "20260729_02"
down_revision = "20260729_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "game_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("game_id", sa.Uuid(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("game_sessions")
