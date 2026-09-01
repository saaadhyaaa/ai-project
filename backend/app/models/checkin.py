import uuid
from datetime import datetime
from typing import List, Optional, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Index,
    func,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class CheckIn(Base):
    """
    Daily Check-in model capturing emotional state, stress, energy, contributing factors, and optional notes.
    """
    __tablename__ = "checkins"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique check-in identifier",
    )
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner user ID",
    )
    mood_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Mood score ranging from 1 (Terrible) to 5 (Great)",
    )
    mood_label: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Text label for mood (e.g. Terrible, Bad, Okay, Good, Great)",
    )
    mood_emoji: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        doc="Visual emoji representation",
    )
    stress_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Stress level ranging from 1 (Calm) to 10 (High Tension)",
    )
    energy_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Energy level ranging from 1 (Exhausted) to 10 (Energized)",
    )
    factors: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="JSON list of contributing factor tags (e.g. ['Sleep', 'Work'])",
    )
    note: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional personal note or context for the check-in",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        doc="Timestamp of the check-in",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="checkins")

    # Table constraints and composite indexes
    __table_args__ = (
        CheckConstraint("mood_score >= 1 AND mood_score <= 5", name="check_mood_score_range"),
        CheckConstraint("stress_level >= 1 AND stress_level <= 10", name="check_stress_level_range"),
        CheckConstraint("energy_level >= 1 AND energy_level <= 10", name="check_energy_level_range"),
        Index("idx_checkin_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<CheckIn id={self.id} user_id={self.user_id} mood={self.mood_score} created_at={self.created_at}>"
