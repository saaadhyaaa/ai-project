import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.micro_goal import (
    CreateMicroGoal,
    UpdateMicroGoal,
    MicroGoalResponse,
    MicroGoalListResponse,
)
from app.services.micro_goal_service import MicroGoalService

logger = logging.getLogger("mindease.api.micro_goals")

router = APIRouter(prefix="/api/v1/micro-goals", tags=["Micro Goals"])


def get_current_user_id(x_user_id: Optional[str] = Header(default="usr-demo-alex")) -> str:
    if not x_user_id or not x_user_id.strip():
        return "usr-demo-alex"
    return x_user_id.strip()


@router.get("", response_model=MicroGoalListResponse)
async def get_micro_goals(
    date: Optional[str] = Query(
        default=None,
        description="Target calendar date in YYYY-MM-DD format (defaults to today)",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    ),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves all micro goals for the specified date for the authenticated user.
    """
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    goals = await MicroGoalService.get_goals_for_date(user_id=user_id, goal_date=target_date, db=db)
    
    goal_responses = [MicroGoalResponse.model_validate(g) for g in goals]
    completed_count = sum(1 for g in goals if g.completed)

    return MicroGoalListResponse(
        date=target_date,
        goals=goal_responses,
        completed_count=completed_count,
        total_count=len(goals),
    )


@router.post("", response_model=MicroGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_micro_goal(
    payload: CreateMicroGoal,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new micro goal for the authenticated user for the specified date.
    Prevents duplicate entries on the same date.
    """
    goal, created = await MicroGoalService.create_goal(
        user_id=user_id,
        payload=payload,
        db=db,
    )
    return MicroGoalResponse.model_validate(goal)


@router.patch("/{goal_id}", response_model=MicroGoalResponse)
async def update_micro_goal(
    goal_id: str,
    payload: UpdateMicroGoal,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates completion status or text for a specific micro goal.
    Enforces user ownership.
    """
    goal = await MicroGoalService.update_goal(
        user_id=user_id,
        goal_id=goal_id,
        payload=payload,
        db=db,
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Micro goal not found or unauthorized.",
        )
    return MicroGoalResponse.model_validate(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
async def delete_micro_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a micro goal owned by the authenticated user.
    """
    deleted = await MicroGoalService.delete_goal(
        user_id=user_id,
        goal_id=goal_id,
        db=db,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Micro goal not found or unauthorized.",
        )
    return {"status": "deleted", "id": goal_id}
