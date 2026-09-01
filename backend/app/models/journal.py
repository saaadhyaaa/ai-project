import uuid
from datetime import datetime
from typing import List, Optional, Any, TYPE_CHECKING
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
    from app.models.user import User


class JournalEntry(Base):
    """
    Journal Entry model for reflective writing, emotion tagging, and future AI emotional synthesis.
    """
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique journal entry identifier",
    )
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner user ID",
    )
    title: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Optional user-provided title for the reflection",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Main journal reflection text content",
    )
    tags: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="JSON list of emotion tags (e.g. ['Calm', 'Grateful'])",
    )
    sentiment: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Sentiment tag (e.g. 'Positive', 'Calm', 'Reflective')",
    )
    ai_insights: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="JSON payload for future Gemini AI reflections and analysis",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        doc="Timestamp of creation",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp of last update",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="journals")

    # Table composite index for user chronological queries
    __table_args__ = (
        Index("idx_journal_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<JournalEntry id={self.id} user_id={self.user_id} title={self.title} created_at={self.created_at}>"
