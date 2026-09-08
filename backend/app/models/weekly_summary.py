import uuid
from datetime import datetime
from typing import Optional, List, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class WeeklySummary(Base):
    """
    Cached weekly emotional synthesis and metrics aggregation.
    """
    __tablename__ = "weekly_summaries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique weekly summary ID",
    )
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner user ID",
    )
    week_start_date: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
        doc="Monday date string for the week in YYYY-MM-DD format",
    )
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Empathetic narrative summary of the week",
    )
    highlights: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="List of positive observations or notable trends",
    )
    patterns: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="List of recurring patterns (e.g. stress correlation)",
    )
    gentle_focus: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Supportive micro-focus for the upcoming days",
    )
    avg_mood: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Calculated average mood score across the week",
    )
    avg_stress: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Calculated average stress level across the week",
    )
    avg_energy: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Calculated average energy level across the week",
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
    user: Mapped["User"] = relationship("User", back_populates="weekly_summaries")

    # Table constraints: one summary per user per week start
    __table_args__ = (
        UniqueConstraint("user_id", "week_start_date", name="uq_user_weekly_summary_date"),
        Index("idx_weekly_summary_user_week", "user_id", "week_start_date"),
    )

    def __repr__(self) -> str:
        return f"<WeeklySummary id={self.id} user_id={self.user_id} week={self.week_start_date}>"
