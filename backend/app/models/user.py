import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.checkin import CheckIn
    from app.models.journal import JournalEntry
    from app.models.conversation import Conversation
    from app.models.micro_goal import MicroGoal
    from app.models.daily_summary import DailySummary
    from app.models.weekly_summary import WeeklySummary


class User(Base):
    """
    User model placeholder for clean foreign key relationships.
    Structured to connect with Firebase Authentication UIDs seamlessly.
    """
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
        doc="Primary identifier (can store UUID or Firebase UID)",
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        doc="User email address",
    )
    display_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        doc="User display name",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp of user account creation",
    )

    # Relationships
    checkins: Mapped[List["CheckIn"]] = relationship(
        "CheckIn",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(CheckIn.created_at)",
    )
    journals: Mapped[List["JournalEntry"]] = relationship(
        "JournalEntry",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(JournalEntry.created_at)",
    )
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(Conversation.updated_at)",
    )
    micro_goals: Mapped[List["MicroGoal"]] = relationship(
        "MicroGoal",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(MicroGoal.created_at)",
    )
    daily_summaries: Mapped[List["DailySummary"]] = relationship(
        "DailySummary",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(DailySummary.summary_date)",
    )
    weekly_summaries: Mapped[List["WeeklySummary"]] = relationship(
        "WeeklySummary",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(WeeklySummary.week_start_date)",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"

