import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings, Settings
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ChatMessageRequest,
    ChatResponse,
    ConversationSummary,
    ConversationDetail,
    MessageResponse,
    CrisisResource,
    ProviderCard,
)
from app.services.safety_service import SafetyService
from app.services.chat_context_service import ChatContextService
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/api/v1/chat", tags=["AI Emotional Support Chat"])


async def get_current_user(
    x_user_id: Optional[str] = Header(default="usr-demo-alex", alias="X-User-ID"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Retrieves or establishes the authenticated user record in database.
    Guarantees that foreign key relationships remain valid.
    """
    user_id = x_user_id or "usr-demo-alex"
    
    # Query user from DB
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=user_id,
            email=f"{user_id}@mindease.ai",
            display_name="Alex Morgan",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def send_chat_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """
    Main conversational endpoint:
    1. Validates request and isolates to authenticated user.
    2. Runs deterministic safety check for crisis patterns.
    3. Builds bounded MindEase context (recent check-ins, journal themes).
    4. Evaluates conditional Google Maps Grounding if provider search is requested.
    5. Queries Gemini AI for structured emotional support.
    6. Persists conversation and message history.
    """
    user_id = current_user.id
    now = datetime.now(timezone.utc)

    # 1. Deterministic Safety Evaluation
    safety_level, is_immediate_override = SafetyService.evaluate_message_safety(payload.message)

    # 2. Get or create conversation record
    conversation: Optional[Conversation] = None
    if payload.conversation_id:
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conversation = conv_result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title="MindEase Companion",
            summary=None,
        )
        db.add(conversation)
        await db.flush()

    # 3. Handle High-Risk immediate override
    if is_immediate_override:
        high_risk_msg, high_risk_suggestions, high_risk_followup = SafetyService.generate_high_risk_response()

        # Persist user message
        user_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="user",
            content=payload.message,
            safety_level=safety_level,
        )
        db.add(user_msg)

        # Persist assistant emergency response
        assistant_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role="assistant",
            content=high_risk_msg,
            suggestions=high_risk_suggestions,
            follow_up_question=high_risk_followup,
            safety_level="HIGH_RISK",
            providers=[],
        )
        db.add(assistant_msg)
        conversation.updated_at = now
        await db.commit()

        return ChatResponse(
            conversation_id=conversation.id,
            message=high_risk_msg,
            suggestions=high_risk_suggestions,
            follow_up_question=high_risk_followup,
            safety_level="HIGH_RISK",
            providers=[],
            created_at=now,
        )

    # 4. Build bounded context
    context_data = await ChatContextService.build_user_context(
        user_id=user_id,
        conversation_id=conversation.id,
        db=db,
        settings=settings,
    )

    gemini_svc = GeminiService(settings=settings)

    # 5. Check if Provider Search is requested (Conditional Google Maps Grounding)
    is_provider_search = SafetyService.is_provider_search_request(payload.message)
    grounded_providers: List[ProviderCard] = []

    if is_provider_search or payload.latitude is not None or payload.location_query is not None:
        grounded_providers = await gemini_svc.search_grounded_providers(
            query=payload.message,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_query=payload.location_query,
        )

    # 6. Generate AI emotional support response
    ai_response = await gemini_svc.generate_chat_response(
        user_message=payload.message,
        system_context=context_data["system_context"],
        history=context_data["formatted_history"],
    )

    # Final combined safety level
    combined_safety = safety_level if safety_level != "SAFE" else ai_response.safety_level

    # 7. Persist user and assistant messages
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="user",
        content=payload.message,
        safety_level=combined_safety,
    )
    db.add(user_msg)

    # Extract provider dicts for JSON storage
    providers_json = [p.model_dump() for p in grounded_providers] if grounded_providers else []

    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response.message,
        suggestions=ai_response.suggestions,
        follow_up_question=ai_response.follow_up_question,
        safety_level=combined_safety,
        providers=providers_json,
    )
    db.add(assistant_msg)
    conversation.updated_at = now

    # Rolling summary check if history exceeds limit
    if len(context_data["history_messages"]) >= settings.CHAT_MAX_HISTORY_MESSAGES:
        recent_pairs = [
            {"role": m.role, "content": m.content}
            for m in context_data["history_messages"][:6]
        ]
        new_summary = await gemini_svc.summarize_conversation(
            current_summary=conversation.summary,
            messages=recent_pairs,
        )
        conversation.summary = new_summary

    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        message=ai_response.message,
        suggestions=ai_response.suggestions,
        follow_up_question=ai_response.follow_up_question,
        safety_level=combined_safety,
        providers=grounded_providers,
        created_at=now,
    )


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists all emotional support conversations belonging to the authenticated user.
    """
    user_id = current_user.id
    query = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    result = await db.execute(query)
    convs = result.scalars().all()

    summaries: List[ConversationSummary] = []
    for c in convs:
        # Get count and last message
        msg_query = (
            select(Message)
            .where(Message.conversation_id == c.id)
            .order_by(Message.created_at.desc())
        )
        msg_result = await db.execute(msg_query)
        msgs = msg_result.scalars().all()
        last_msg = msgs[0].content if msgs else None

        summaries.append(
            ConversationSummary(
                id=c.id,
                title=c.title or "MindEase Companion",
                summary=c.summary,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=len(msgs),
                last_message=last_msg,
            )
        )

    return summaries


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves full conversation detail with message history for the authenticated user.
    """
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    messages = msg_result.scalars().all()

    formatted_messages = []
    for m in messages:
        providers_list = [ProviderCard(**p) for p in m.providers] if m.providers else []
        formatted_messages.append(
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                suggestions=m.suggestions,
                follow_up_question=m.follow_up_question,
                safety_level=m.safety_level or "SAFE",
                providers=providers_list,
                created_at=m.created_at,
            )
        )

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title or "MindEase Companion",
        summary=conversation.summary,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=formatted_messages,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a conversation belonging to the authenticated user.
    """
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    await db.delete(conversation)
    await db.commit()
    return None


@router.get("/crisis-resources", response_model=List[CrisisResource])
async def get_crisis_resources():
    """
    Public endpoint returning curated 24/7 crisis and mental health resources.
    """
    return SafetyService.get_crisis_resources()
