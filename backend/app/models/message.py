import uuid
from datetime import datetime
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.conversation import Conversation


class Message(Base):
    """
    Message model representing a turn in an emotional support conversation.
    Roles: 'user' or 'assistant'.
    Stores clean structured data: content, suggested follow-ups, safety evaluation,
    and grounded provider cards. Sensitive data (exact lat/lng coordinates, raw API tokens)
    are NEVER stored.
    """
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique message UUID",
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key to conversations table",
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Role of the speaker ('user' or 'assistant')",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Text content of the message",
    )
    suggestions: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="JSON list of 2-4 practical suggestion chips (e.g. ['5-4-3-2-1 Grounding', 'Break it down'])",
    )
    follow_up_question: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional gentle follow-up question for the user",
    )
    safety_level: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        default="SAFE",
        doc="Safety evaluation flag: SAFE, CONCERNING, or HIGH_RISK",
    )
    providers: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="JSON list of Google Maps grounded provider cards (if requested)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        doc="Timestamp of message creation",
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages",
    )

    __table_args__ = (
        Index("idx_message_conv_created", "conversation_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Message id={self.id} conv={self.conversation_id} role={self.role}>"
