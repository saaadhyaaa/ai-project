import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class MicroGoal(Base):
    """
    Persistent micro goals for daily achievable mental wellness actions.
    Can originate from chatbot suggestions or manual user creation.
    """
    __tablename__ = "micro_goals"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique micro goal ID",
    )
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner user ID",
    )
    goal_text: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Actionable goal statement (e.g., 'Take a 10-minute walk')",
    )
    goal_date: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
        doc="Calendar day string in YYYY-MM-DD format",
    )
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Completion status",
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when goal was marked completed",
    )
    source: Mapped[str] = mapped_column(
        String(20),
        default="manual",
        nullable=False,
        doc="Goal origin ('manual' or 'chatbot')",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Creation timestamp",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Last updated timestamp",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="micro_goals")

    # Composite index for user + date queries
    __table_args__ = (
        Index("idx_micro_goals_user_date", "user_id", "goal_date"),
    )

    def __repr__(self) -> str:
        return f"<MicroGoal id={self.id} user_id={self.user_id} date={self.goal_date} completed={self.completed}>"
