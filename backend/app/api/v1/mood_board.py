import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings, Settings
from app.database import get_db
from app.schemas.mood_board import (
    MonthMoodResponse,
    DayDetailResponse,
    WeeklyMoodResponse,
    DailySummaryRequest,
    WeeklySummaryRequest,
)
from app.services.mood_board_service import MoodBoardService
from app.services.gemini_service import GeminiService

logger = logging.getLogger("mindease.api.mood_board")

router = APIRouter(prefix="/api/v1/mood-board", tags=["Mood Board"])


def get_current_user_id(x_user_id: Optional[str] = Header(default="usr-demo-alex")) -> str:
    if not x_user_id or not x_user_id.strip():
        return "usr-demo-alex"
    return x_user_id.strip()


def get_gemini_service(settings: Settings = Depends(get_settings)) -> GeminiService:
    return GeminiService(settings=settings)


@router.get("/month", response_model=MonthMoodResponse)
async def get_month_mood_board(
    year: int = Query(..., ge=2000, le=2100, description="Calendar year (e.g. 2026)"),
    month: int = Query(..., ge=1, le=12, description="Calendar month (1-12)"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns monthly mood calendar indicators, check-in, journal, and goal markers.
    """
    return await MoodBoardService.get_month_mood_board(
        user_id=user_id,
        year=year,
        month=month,
        db=db,
    )


@router.get("/day", response_model=DayDetailResponse)
async def get_day_mood_detail(
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """
    Returns complete emotional details for a single day: check-in, journals, micro goals, and daily summary.
    """
    return await MoodBoardService.get_day_detail(
        user_id=user_id,
        date_str=date,
        db=db,
        gemini_service=gemini_service,
        force_regenerate_summary=False,
    )


@router.get("/week", response_model=WeeklyMoodResponse)
async def get_week_mood_board(
    start_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Week start date (Monday) in YYYY-MM-DD"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """
    Returns 7-day emotional metrics, common factors and emotions, daily breakdown, micro goal statistics, and weekly summary.
    """
    return await MoodBoardService.get_week_mood_board(
        user_id=user_id,
        start_date_str=start_date,
        db=db,
        gemini_service=gemini_service,
        force_regenerate_summary=False,
    )


@router.post("/summary/day", response_model=DayDetailResponse)
async def regenerate_daily_summary(
    payload: DailySummaryRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """
    Forces regeneration and caching of daily emotional summary for the specified date.
    """
    return await MoodBoardService.get_day_detail(
        user_id=user_id,
        date_str=payload.date,
        db=db,
        gemini_service=gemini_service,
        force_regenerate_summary=True,
    )


@router.post("/summary/week", response_model=WeeklyMoodResponse)
async def regenerate_weekly_summary(
    payload: WeeklySummaryRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """
    Forces regeneration and caching of weekly emotional summary for the specified week start date.
    """
    return await MoodBoardService.get_week_mood_board(
        user_id=user_id,
        start_date_str=payload.start_date,
        db=db,
        gemini_service=gemini_service,
        force_regenerate_summary=True,
    )
