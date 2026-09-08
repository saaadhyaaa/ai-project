from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ChatMessageRequest(BaseModel):
    """
    Incoming request schema for user emotional support chat message.
    """
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's message to the companion",
        examples=["I've been feeling really overwhelmed with college lately."],
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional existing conversation UUID to resume",
    )
    latitude: Optional[float] = Field(
        default=None,
        description="Optional user latitude for grounded provider search",
    )
    longitude: Optional[float] = Field(
        default=None,
        description="Optional user longitude for grounded provider search",
    )
    location_query: Optional[str] = Field(
        default=None,
        max_length=150,
        description="Optional broad city or area text if geolocation is unavailable or denied",
    )

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -90.0 or v > 90.0):
            raise ValueError("Latitude must be between -90.0 and 90.0")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -180.0 or v > 180.0):
            raise ValueError("Longitude must be between -180.0 and 180.0")
        return v


class ProviderCard(BaseModel):
    """
    Grounded healthcare / therapist facility card from Google Maps Grounding.
    Information is only populated if actually grounded; never fabricated.
    """
    name: str = Field(..., description="Provider or clinic name")
    maps_url: Optional[str] = Field(default=None, description="Google Maps URL")
    place_id: Optional[str] = Field(default=None, description="Google Maps Place ID")
    description: Optional[str] = Field(default=None, description="Grounded snippet or specialty")
    address: Optional[str] = Field(default=None, description="Grounded physical address")


class ChatAIResponse(BaseModel):
    """
    Structured response model returned by Gemini AI engine.
    """
    message: str = Field(..., description="Empathic, supportive, concise companion response")
    suggestions: List[str] = Field(
        default_factory=list,
        description="2-4 practical, tangible micro-actions or coping steps",
    )
    follow_up_question: Optional[str] = Field(
        default=None,
        description="Optional gentle reflective question",
    )
    safety_level: Literal["SAFE", "CONCERNING", "HIGH_RISK"] = Field(
        default="SAFE",
        description="AI classified safety level",
    )


class ChatResponse(BaseModel):
    """
    Public API response sent back to the frontend client.
    """
    conversation_id: str = Field(..., description="UUID of the current conversation")
    message: str = Field(..., description="The assistant's emotional support response")
    suggestions: List[str] = Field(
        default_factory=list,
        description="Concrete suggestion chips (e.g. breathing, grounding, task breakdown)",
    )
    follow_up_question: Optional[str] = Field(
        default=None,
        description="Optional gentle inquiry",
    )
    safety_level: Literal["SAFE", "CONCERNING", "HIGH_RISK"] = Field(
        default="SAFE",
        description="Safety evaluation level",
    )
    providers: List[ProviderCard] = Field(
        default_factory=list,
        description="Google Maps grounded therapist/clinic providers if searched",
    )
    created_at: datetime = Field(..., description="Creation timestamp")


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    suggestions: Optional[List[str]] = None
    follow_up_question: Optional[str] = None
    safety_level: Optional[str] = "SAFE"
    providers: Optional[List[ProviderCard]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationSummary(BaseModel):
    id: str
    title: Optional[str] = "MindEase Companion"
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationDetail(BaseModel):
    id: str
    title: Optional[str] = "MindEase Companion"
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CrisisResource(BaseModel):
    name: str
    category: str
    phone: Optional[str] = None
    sms: Optional[str] = None
    url: Optional[str] = None
    description: str
    country: str = "India"
