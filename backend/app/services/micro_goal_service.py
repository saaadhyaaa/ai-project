import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.micro_goal import MicroGoal
from app.models.user import User
from app.schemas.micro_goal import CreateMicroGoal, UpdateMicroGoal

logger = logging.getLogger("mindease.micro_goals")

MAX_DAILY_GOALS = 10


class MicroGoalService:
    """
    Handles CRUD operations, duplicate prevention, and date-scoped tracking
    for authenticated user daily micro goals.
    """

    @classmethod
    async def get_goals_for_date(
        cls,
        user_id: str,
        goal_date: str,
        db: AsyncSession,
    ) -> List[MicroGoal]:
        """
        Retrieves all micro goals for the given calendar day for the authenticated user.
        """
        query = (
            select(MicroGoal)
            .where(
                and_(
                    MicroGoal.user_id == user_id,
                    MicroGoal.goal_date == goal_date,
                )
            )
            .order_by(MicroGoal.created_at.asc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @classmethod
    async def create_goal(
        cls,
        user_id: str,
        payload: CreateMicroGoal,
        db: AsyncSession,
    ) -> Tuple[MicroGoal, bool]:
        """
        Creates a new micro goal for the specified date.
        Prevents duplicate identical goals on the same day.
        Returns (MicroGoal, was_created: bool).
        """
        # Ensure user exists
        user_query = select(User).where(User.id == user_id)
        user_res = await db.execute(user_query)
        user = user_res.scalar_one_or_none()
        if not user:
            user = User(id=user_id, display_name="Alex")
            db.add(user)
            await db.flush()

        clean_text = payload.goal_text.strip()
        if not clean_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Goal text cannot be empty.",
            )

        # Check for existing duplicate goal on the same day
        existing_query = select(MicroGoal).where(
            and_(
                MicroGoal.user_id == user_id,
                MicroGoal.goal_date == payload.goal_date,
                func.lower(MicroGoal.goal_text) == clean_text.lower(),
            )
        )
        existing_res = await db.execute(existing_query)
        existing_goal = existing_res.scalar_one_or_none()
        if existing_goal:
            return existing_goal, False

        # Check daily limit to keep goals manageable and bite-sized
        count_query = select(func.count(MicroGoal.id)).where(
            and_(
                MicroGoal.user_id == user_id,
                MicroGoal.goal_date == payload.goal_date,
            )
        )
        count_res = await db.execute(count_query)
        current_count = count_res.scalar() or 0

        if current_count >= MAX_DAILY_GOALS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have reached the maximum of {MAX_DAILY_GOALS} micro goals for today. Focus on completing your active goals first.",
            )

        new_goal = MicroGoal(
            user_id=user_id,
            goal_text=clean_text,
            goal_date=payload.goal_date,
            completed=False,
            completed_at=None,
            source=payload.source or "manual",
        )
        db.add(new_goal)
        await db.commit()
        await db.refresh(new_goal)
        return new_goal, True

    @classmethod
    async def update_goal(
        cls,
        user_id: str,
        goal_id: str,
        payload: UpdateMicroGoal,
        db: AsyncSession,
    ) -> Optional[MicroGoal]:
        """
        Updates completion status or text of an existing goal owned by the user.
        """
        query = select(MicroGoal).where(
            and_(
                MicroGoal.id == goal_id,
                MicroGoal.user_id == user_id,
            )
        )
        result = await db.execute(query)
        goal = result.scalar_one_or_none()
        if not goal:
            return None

        if payload.completed is not None:
            goal.completed = payload.completed
            if payload.completed:
                goal.completed_at = datetime.now(timezone.utc)
            else:
                goal.completed_at = None

        if payload.goal_text is not None:
            clean_text = payload.goal_text.strip()
            if clean_text:
                goal.goal_text = clean_text

        await db.commit()
        await db.refresh(goal)
        return goal

    @classmethod
    async def delete_goal(
        cls,
        user_id: str,
        goal_id: str,
        db: AsyncSession,
    ) -> bool:
        """
        Deletes a micro goal if owned by the user.
        """
        query = select(MicroGoal).where(
            and_(
                MicroGoal.id == goal_id,
                MicroGoal.user_id == user_id,
            )
        )
        result = await db.execute(query)
        goal = result.scalar_one_or_none()
        if not goal:
            return False

        await db.delete(goal)
        await db.commit()
        return True

    @classmethod
    async def get_range_goal_stats(
        cls,
        user_id: str,
        start_date: str,
        end_date: str,
        db: AsyncSession,
    ) -> Tuple[int, int, float]:
        """
        Calculates completed goals, total goals, and completion rate in a date range.
        Returns (completed, total, rate_percent).
        """
        query = select(MicroGoal).where(
            and_(
                MicroGoal.user_id == user_id,
                MicroGoal.goal_date >= start_date,
                MicroGoal.goal_date <= end_date,
            )
        )
        result = await db.execute(query)
        goals = list(result.scalars().all())

        total = len(goals)
        completed = sum(1 for g in goals if g.completed)
        rate = (completed / total * 100.0) if total > 0 else 0.0
        return completed, total, round(rate, 1)
