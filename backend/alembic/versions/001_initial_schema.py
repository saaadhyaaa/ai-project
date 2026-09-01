"""create_users_checkins_journals_tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-01 23:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Users table (placeholder for Firebase Auth)
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    # 2. Create CheckIns table
    op.create_table(
        "checkins",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("mood_score", sa.Integer(), nullable=False),
        sa.Column("mood_label", sa.String(length=50), nullable=False),
        sa.Column("mood_emoji", sa.String(length=10), nullable=True),
        sa.Column("stress_level", sa.Integer(), nullable=False),
        sa.Column("energy_level", sa.Integer(), nullable=False),
        sa.Column("factors", sa.JSON(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("mood_score >= 1 AND mood_score <= 5", name="check_mood_score_range"),
        sa.CheckConstraint("stress_level >= 1 AND stress_level <= 10", name="check_stress_level_range"),
        sa.CheckConstraint("energy_level >= 1 AND energy_level <= 10", name="check_energy_level_range"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_checkins_user_id"), "checkins", ["user_id"], unique=False)
    op.create_index(op.f("ix_checkins_created_at"), "checkins", ["created_at"], unique=False)
    op.create_index("idx_checkin_user_created", "checkins", ["user_id", "created_at"], unique=False)

    # 3. Create Journal Entries table
    op.create_table(
        "journal_entries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("sentiment", sa.String(length=50), nullable=True),
        sa.Column("ai_insights", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_journal_entries_user_id"), "journal_entries", ["user_id"], unique=False)
    op.create_index(op.f("ix_journal_entries_created_at"), "journal_entries", ["created_at"], unique=False)
    op.create_index("idx_journal_user_created", "journal_entries", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_journal_user_created", table_name="journal_entries")
    op.drop_index(op.f("ix_journal_entries_created_at"), table_name="journal_entries")
    op.drop_index(op.f("ix_journal_entries_user_id"), table_name="journal_entries")
    op.drop_table("journal_entries")

    op.drop_index("idx_checkin_user_created", table_name="checkins")
    op.drop_index(op.f("ix_checkins_created_at"), table_name="checkins")
    op.drop_index(op.f("ix_checkins_user_id"), table_name="checkins")
    op.drop_table("checkins")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
