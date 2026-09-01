from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class JournalEntryBase(BaseModel):
    title: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional title for the reflection",
        examples=["Finding stillness amidst a busy week"],
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Main journal reflection text content (non-empty)",
        examples=["Today I realized the power of taking five deep breaths before meetings."],
    )
    tags: Optional[List[str]] = Field(
        default=None,
        description="List of emotion tags (e.g. Calm, Grateful, Motivated)",
        examples=[["Calm", "Grateful"]],
    )
    sentiment: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Detected or user-selected sentiment",
        examples=["Calm"],
    )
    ai_insights: Optional[Dict[str, Any]] = Field(
        default=None,
        description="AI emotional synthesis payload (reserved for future Gemini integration)",
    )


class CreateJournalEntry(JournalEntryBase):
    user_id: Optional[str] = Field(
        default=None,
        description="User identifier (auto-populated by auth or dev default)",
    )


class JournalEntryResponse(JournalEntryBase):
    id: str = Field(..., description="Unique journal entry ID")
    user_id: str = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last updated timestamp")

    model_config = ConfigDict(from_attributes=True)
