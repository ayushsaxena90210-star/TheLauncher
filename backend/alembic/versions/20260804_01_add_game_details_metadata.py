"""Add locally cached game-details metadata fields.

Revision ID: 20260804_01
Revises: 20260802_01
Create Date: 2026-08-04
"""

from alembic import op
import sqlalchemy as sa

revision = "20260804_01"
down_revision = "20260802_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("games") as batch_op:
        batch_op.add_column(sa.Column("developers", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("publishers", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("platforms", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("rating", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("age_rating", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("themes", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("franchises", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("game_modes", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("official_website", sa.String(length=2048), nullable=True))
        batch_op.add_column(sa.Column("screenshot_paths", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("games") as batch_op:
        for column in ("screenshot_paths", "official_website", "game_modes", "franchises", "themes", "age_rating", "rating", "platforms", "publishers", "developers"):
            batch_op.drop_column(column)
