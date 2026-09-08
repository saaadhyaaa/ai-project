"""add_conversations_and_messages_tables

Revision ID: 002_chat_tables
Revises: 001_initial_schema
Create Date: 2026-09-08 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002_chat_tables"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Conversations table if not exists
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_conversations_user_id"), "conversations", ["user_id"], unique=False, if_not_exists=True)
    op.create_index("idx_conversation_user_updated", "conversations", ["user_id", "updated_at"], unique=False, if_not_exists=True)

    # 2. Create Messages table if not exists
    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("conversation_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("suggestions", sa.JSON(), nullable=True),
        sa.Column("follow_up_question", sa.Text(), nullable=True),
        sa.Column("safety_level", sa.String(length=20), nullable=True),
        sa.Column("providers", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index(op.f("ix_messages_conversation_id"), "messages", ["conversation_id"], unique=False, if_not_exists=True)
    op.create_index(op.f("ix_messages_created_at"), "messages", ["created_at"], unique=False, if_not_exists=True)
    op.create_index("idx_message_conv_created", "messages", ["conversation_id", "created_at"], unique=False, if_not_exists=True)


def downgrade() -> None:
    op.drop_index("idx_message_conv_created", table_name="messages")
    op.drop_index(op.f("ix_messages_created_at"), table_name="messages")
    op.drop_index(op.f("ix_messages_conversation_id"), table_name="messages")
    op.drop_table("messages")

    op.drop_index("idx_conversation_user_updated", table_name="conversations")
    op.drop_index(op.f("ix_conversations_user_id"), table_name="conversations")
    op.drop_table("conversations")
