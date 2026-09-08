"""add_mood_board_and_micro_goals_tables

Revision ID: 003_mood_micro_goals
Revises: 002_chat_tables
Create Date: 2026-09-08 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003_mood_micro_goals"
down_revision: Union[str, None] = "002_chat_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create micro_goals table
    op.create_table(
        "micro_goals",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("goal_text", sa.String(length=255), nullable=False),
        sa.Column("goal_date", sa.String(length=10), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=False, server_default=sa.text("'manual'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_micro_goals_user_id"), "micro_goals", ["user_id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_micro_goals_goal_date"), "micro_goals", ["goal_date"], unique=False, if_not_exists=True)
    op.create_index("idx_micro_goals_user_date", "micro_goals", ["user_id", "goal_date"], unique=False, if_not_exists=True)

    # 2. Create daily_summaries table
    op.create_table(
        "daily_summaries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("summary_date", sa.String(length=10), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "summary_date", name="uq_user_daily_summary_date"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_daily_summaries_user_id"), "daily_summaries", ["user_id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_daily_summaries_summary_date"), "daily_summaries", ["summary_date"], unique=False, if_not_exists=True)
    op.create_index("idx_daily_summary_user_date", "daily_summaries", ["user_id", "summary_date"], unique=False, if_not_exists=True)

    # 3. Create weekly_summaries table
    op.create_table(
        "weekly_summaries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("week_start_date", sa.String(length=10), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("highlights", sa.JSON(), nullable=True),
        sa.Column("patterns", sa.JSON(), nullable=True),
        sa.Column("gentle_focus", sa.Text(), nullable=True),
        sa.Column("avg_mood", sa.Float(), nullable=True),
        sa.Column("avg_stress", sa.Float(), nullable=True),
        sa.Column("avg_energy", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "week_start_date", name="uq_user_weekly_summary_date"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_weekly_summaries_user_id"), "weekly_summaries", ["user_id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_weekly_summaries_week_start_date"), "weekly_summaries", ["week_start_date"], unique=False, if_not_exists=True)
    op.create_index("idx_weekly_summary_user_week", "weekly_summaries", ["user_id", "week_start_date"], unique=False, if_not_exists=True)


def downgrade() -> None:
    op.drop_index("idx_weekly_summary_user_week", table_name="weekly_summaries")
    op.drop_index(op.f("ix_weekly_summaries_week_start_date"), table_name="weekly_summaries")
    op.drop_index(op.f("ix_weekly_summaries_user_id"), table_name="weekly_summaries")
    op.drop_table("weekly_summaries")

    op.drop_index("idx_daily_summary_user_date", table_name="daily_summaries")
    op.drop_index(op.f("ix_daily_summaries_summary_date"), table_name="daily_summaries")
    op.drop_index(op.f("ix_daily_summaries_user_id"), table_name="daily_summaries")
    op.drop_table("daily_summaries")

    op.drop_index("idx_micro_goals_user_date", table_name="micro_goals")
    op.drop_index(op.f("ix_micro_goals_goal_date"), table_name="micro_goals")
    op.drop_index(op.f("ix_micro_goals_user_id"), table_name="micro_goals")
    op.drop_table("micro_goals")
