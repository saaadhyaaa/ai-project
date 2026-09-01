from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CheckInBase(BaseModel):
    mood_score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Mood rating from 1 (Terrible) to 5 (Great)",
        examples=[4],
    )
    mood_label: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Descriptive text label for mood",
        examples=["Good"],
    )
    mood_emoji: Optional[str] = Field(
        default=None,
        max_length=10,
        description="Emoji representing emotional state",
        examples=["🙂"],
    )
    stress_level: int = Field(
        ...,
        ge=1,
        le=10,
        description="Stress rating from 1 (Relaxed) to 10 (High Tension)",
        examples=[4],
    )
    energy_level: int = Field(
        ...,
        ge=1,
        le=10,
        description="Energy rating from 1 (Exhausted) to 10 (Energized)",
        examples=[7],
    )
    factors: Optional[List[str]] = Field(
        default=None,
        description="List of contributing factors (e.g., Sleep, Work)",
        examples=[["Quality Sleep", "Exercise"]],
    )
    note: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Optional personal reflection note",
        examples=["Felt focused and energized after morning walk."],
    )


class CreateCheckIn(CheckInBase):
    user_id: Optional[str] = Field(
        default=None,
        description="User identifier (auto-populated by auth or dev default)",
    )


class CheckInResponse(CheckInBase):
    id: str = Field(..., description="Unique check-in ID")
    user_id: str = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)
