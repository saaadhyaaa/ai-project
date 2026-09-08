import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class DailySummary(Base):
    """
    Cached daily emotional summary generated from structured check-in,
    contributing factors, and journal entries.
    """
    __tablename__ = "daily_summaries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique daily summary ID",
    )
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner user ID",
    )
    summary_date: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
        doc="Calendar date string in YYYY-MM-DD format",
    )
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Supportive, non-diagnostic emotional reflection summary text",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
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
    user: Mapped["User"] = relationship("User", back_populates="daily_summaries")

    # Table constraints: one summary per user per day
    __table_args__ = (
        UniqueConstraint("user_id", "summary_date", name="uq_user_daily_summary_date"),
        Index("idx_daily_summary_user_date", "user_id", "summary_date"),
    )

    def __repr__(self) -> str:
        return f"<DailySummary id={self.id} user_id={self.user_id} date={self.summary_date}>"
