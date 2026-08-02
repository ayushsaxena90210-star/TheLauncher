"""Add metadata fields to games table.

Revision ID: 20260802_01
Revises: 20260729_02
Create Date: 2026-08-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260802_01"
down_revision = "20260729_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("games") as batch_op:
        batch_op.add_column(sa.Column("igdb_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("metadata_source", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("metadata_confidence", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("genres", sa.String(length=500), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("games") as batch_op:
        batch_op.drop_column("genres")
        batch_op.drop_column("metadata_confidence")
        batch_op.drop_column("metadata_source")
        batch_op.drop_column("igdb_id")
