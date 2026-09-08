import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.checkin import CheckIn
from app.models.user import User
from app.schemas.checkin import CreateCheckIn, CheckInResponse

logger = logging.getLogger("mindease.api.checkins")

router = APIRouter(prefix="/api/v1/checkins", tags=["Check-ins"])


def get_current_user_id(x_user_id: Optional[str] = Header(default="usr-demo-alex")) -> str:
    if not x_user_id or not x_user_id.strip():
        return "usr-demo-alex"
    return x_user_id.strip()


@router.get("", response_model=List[CheckInResponse])
async def list_checkins(
    limit: int = Query(default=30, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists recent check-ins for the authenticated user in reverse chronological order.
    """
    query = (
        select(CheckIn)
        .where(CheckIn.user_id == user_id)
        .order_by(CheckIn.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    checkins = list(result.scalars().all())
    return [CheckInResponse.model_validate(c) for c in checkins]


@router.post("", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
async def create_checkin(
    payload: CreateCheckIn,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates and persists a new daily check-in for the authenticated user.
    """
    # Ensure user exists in database
    user_query = select(User).where(User.id == user_id)
    user_res = await db.execute(user_query)
    user = user_res.scalar_one_or_none()
    if not user:
        user = User(id=user_id, display_name="Alex")
        db.add(user)
        await db.flush()

    new_checkin = CheckIn(
        user_id=user_id,
        mood_score=payload.mood_score,
        mood_label=payload.mood_label,
        mood_emoji=payload.mood_emoji,
        stress_level=payload.stress_level,
        energy_level=payload.energy_level,
        factors=payload.factors,
        note=payload.note,
    )
    db.add(new_checkin)
    await db.commit()
    await db.refresh(new_checkin)

    return CheckInResponse.model_validate(new_checkin)


@router.get("/{checkin_id}", response_model=CheckInResponse)
async def get_checkin(
    checkin_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches a specific check-in owned by the authenticated user.
    """
    query = select(CheckIn).where(
        and_(
            CheckIn.id == checkin_id,
            CheckIn.user_id == user_id,
        )
    )
    result = await db.execute(query)
    checkin = result.scalar_one_or_none()
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found or unauthorized.",
        )
    return CheckInResponse.model_validate(checkin)
