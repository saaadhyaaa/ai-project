from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.micro_goal import MicroGoalResponse


class MonthMoodDay(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    mood_score: Optional[int] = Field(None, ge=1, le=5, description="Check-in mood score (1-5)")
    mood_label: Optional[str] = Field(None, description="Mood label (Terrible, Bad, Okay, Good, Great)")
    mood_emoji: Optional[str] = Field(None, description="Emoji representation")
    stress: Optional[int] = Field(None, ge=1, le=10, description="Stress level (1-10)")
    energy: Optional[int] = Field(None, ge=1, le=10, description="Energy level (1-10)")
    has_checkin: bool = Field(False, description="Whether a check-in exists for this date")
    has_journal: bool = Field(False, description="Whether journal reflections exist for this date")
    journal_count: int = Field(0, description="Number of journal entries for this date")
    goal_count: int = Field(0, description="Total micro goals for this date")
    completed_goal_count: int = Field(0, description="Completed micro goals for this date")


class MonthMoodResponse(BaseModel):
    year: int = Field(..., description="Selected calendar year")
    month: int = Field(..., description="Selected calendar month (1-12)")
    days: List[MonthMoodDay] = Field(default_factory=list, description="Days with mood and activity indicators")


class DayCheckInDetail(BaseModel):
    id: str = Field(..., description="Check-in ID")
    mood_score: int = Field(..., ge=1, le=5)
    mood_label: str = Field(...)
    mood_emoji: Optional[str] = Field(None)
    stress_level: int = Field(..., ge=1, le=10)
    energy_level: int = Field(..., ge=1, le=10)
    factors: Optional[List[str]] = Field(default_factory=list)
    note: Optional[str] = Field(None)
    created_at: datetime = Field(...)

    model_config = ConfigDict(from_attributes=True)


class DayJournalPreview(BaseModel):
    id: str = Field(..., description="Journal entry ID")
    title: Optional[str] = Field(None)
    preview: str = Field(...)
    sentiment: Optional[str] = Field(None)
    tags: Optional[List[str]] = Field(default_factory=list)
    created_at: datetime = Field(...)

    model_config = ConfigDict(from_attributes=True)


class DayDetailResponse(BaseModel):
    date: str = Field(..., description="Selected date in YYYY-MM-DD")
    checkin: Optional[DayCheckInDetail] = Field(None, description="Check-in details for the date")
    journals: List[DayJournalPreview] = Field(default_factory=list, description="Journal reflections for the date")
    daily_summary: Optional[str] = Field(None, description="Supportive emotional daily summary")
    micro_goals: List[MicroGoalResponse] = Field(default_factory=list, description="Micro goals for this date")


class WeeklyMetrics(BaseModel):
    average_mood: Optional[float] = Field(None, description="Average mood score (1-5)")
    average_stress: Optional[float] = Field(None, description="Average stress level (1-10)")
    average_energy: Optional[float] = Field(None, description="Average energy level (1-10)")
    checkin_count: int = Field(0, description="Total check-ins logged during the week")
    journal_count: int = Field(0, description="Total journal entries logged during the week")


class WeeklyMicroGoalsMetric(BaseModel):
    completed: int = Field(0, description="Completed micro goals count")
    total: int = Field(0, description="Total micro goals count")
    completion_rate: float = Field(0.0, description="Percentage of micro goals completed")


class WeeklySummaryAIResponse(BaseModel):
    summary: str = Field(..., description="Supportive, non-diagnostic weekly emotional reflection")
    highlights: List[str] = Field(default_factory=list, description="Positive moments or resilience noticed")
    patterns: List[str] = Field(default_factory=list, description="Observed correlations without clinical claims")
    gentle_focus: Optional[str] = Field(None, description="Gentle, bite-sized wellness intention")


class WeeklyMoodResponse(BaseModel):
    start_date: str = Field(..., description="Monday start date of the week (YYYY-MM-DD)")
    end_date: str = Field(..., description="Sunday end date of the week (YYYY-MM-DD)")
    metrics: WeeklyMetrics = Field(..., description="Aggregated numerical metrics")
    common_emotions: List[str] = Field(default_factory=list, description="Top recurring emotion tags")
    common_factors: List[str] = Field(default_factory=list, description="Top recurring lifestyle factors")
    daily_breakdown: List[MonthMoodDay] = Field(default_factory=list, description="Day-by-day indicators for the week")
    summary: Optional[str] = Field(None, description="Empathetic narrative summary")
    highlights: Optional[List[str]] = Field(default_factory=list, description="Weekly highlights")
    patterns: Optional[List[str]] = Field(default_factory=list, description="Identified patterns")
    gentle_focus: Optional[str] = Field(None, description="Supportive focus note")
    micro_goals: WeeklyMicroGoalsMetric = Field(..., description="Micro goal completion statistics")


class DailySummaryRequest(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    force_regenerate: bool = Field(False, description="Whether to recompute summary even if cached")


class WeeklySummaryRequest(BaseModel):
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    force_regenerate: bool = Field(False, description="Whether to recompute summary even if cached")
