import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.journal import JournalEntry
from app.models.user import User
from app.schemas.journal import CreateJournalEntry, JournalEntryResponse

logger = logging.getLogger("mindease.api.journals")

router = APIRouter(prefix="/api/v1/journals", tags=["Journal"])


def get_current_user_id(x_user_id: Optional[str] = Header(default="usr-demo-alex")) -> str:
    if not x_user_id or not x_user_id.strip():
        return "usr-demo-alex"
    return x_user_id.strip()


@router.get("", response_model=List[JournalEntryResponse])
async def list_journals(
    limit: int = Query(default=30, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists recent journal reflections for the authenticated user in reverse chronological order.
    """
    query = (
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    journals = list(result.scalars().all())
    return [JournalEntryResponse.model_validate(j) for j in journals]


@router.post("", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_journal(
    payload: CreateJournalEntry,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates and persists a new journal reflection for the authenticated user.
    """
    # Ensure user exists in database
    user_query = select(User).where(User.id == user_id)
    user_res = await db.execute(user_query)
    user = user_res.scalar_one_or_none()
    if not user:
        user = User(id=user_id, display_name="Alex")
        db.add(user)
        await db.flush()

    new_journal = JournalEntry(
        user_id=user_id,
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
        sentiment=payload.sentiment,
        ai_insights=payload.ai_insights,
    )
    db.add(new_journal)
    await db.commit()
    await db.refresh(new_journal)

    return JournalEntryResponse.model_validate(new_journal)


@router.delete("/{journal_id}", status_code=status.HTTP_200_OK)
async def delete_journal(
    journal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a journal entry owned by the authenticated user.
    """
    query = select(JournalEntry).where(
        and_(
            JournalEntry.id == journal_id,
            JournalEntry.user_id == user_id,
        )
    )
    result = await db.execute(query)
    journal = result.scalar_one_or_none()
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found or unauthorized.",
        )
    await db.delete(journal)
    await db.commit()
    return {"status": "deleted", "id": journal_id}
