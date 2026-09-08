from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CreateMicroGoal(BaseModel):
    goal_text: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Clear, actionable, bite-sized wellness goal",
        examples=["Take a 10-minute walk"],
    )
    goal_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Target calendar date in YYYY-MM-DD format",
        examples=["2026-09-08"],
    )
    source: Optional[str] = Field(
        default="manual",
        description="Source of creation ('manual' or 'chatbot')",
        examples=["chatbot"],
    )


class UpdateMicroGoal(BaseModel):
    completed: Optional[bool] = Field(
        default=None,
        description="Whether the goal has been checked off as completed",
    )
    goal_text: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Updated goal text if modifying",
    )


class MicroGoalResponse(BaseModel):
    id: str = Field(..., description="Unique goal ID")
    user_id: str = Field(..., description="Owner user ID")
    goal_text: str = Field(..., description="Goal action text")
    goal_date: str = Field(..., description="Target date in YYYY-MM-DD")
    completed: bool = Field(..., description="Completion state")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    source: str = Field(..., description="Goal origin")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class MicroGoalListResponse(BaseModel):
    date: str = Field(..., description="Date for goals")
    goals: List[MicroGoalResponse] = Field(default_factory=list, description="List of micro goals")
    completed_count: int = Field(0, description="Number of completed goals")
    total_count: int = Field(0, description="Total active goals")
