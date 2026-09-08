import pytest
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import delete

from app.config import get_settings
from app.models.user import User
from app.models.checkin import CheckIn
from app.models.journal import JournalEntry
from app.services.chat_context_service import ChatContextService

settings = get_settings()


@pytest.fixture
async def db_session():
    # Use NullPool for isolated test connections to avoid event-loop mismatch
    test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    session_factory = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_user_data_isolation(db_session: AsyncSession):
    user_a_id = f"test-iso-a-{uuid.uuid4().hex[:8]}"
    user_b_id = f"test-iso-b-{uuid.uuid4().hex[:8]}"

    try:
        user_a = User(id=user_a_id, email=f"{user_a_id}@test.com", display_name="User A")
        user_b = User(id=user_b_id, email=f"{user_b_id}@test.com", display_name="User B")
        db_session.add_all([user_a, user_b])
        await db_session.commit()

        # Seed check-in and journal for User A
        checkin_a = CheckIn(
            id=str(uuid.uuid4()),
            user_id=user_a_id,
            mood_score=2,
            mood_label="Bad",
            stress_level=8,
            energy_level=3,
            factors=["College", "Sleep"],
            note="User A's private college stress note.",
        )
        journal_a = JournalEntry(
            id=str(uuid.uuid4()),
            user_id=user_a_id,
            title="User A's Private Reflection",
            content="I feel so exhausted with exams and sleep deprivation.",
            tags=["Exhausted", "Exams"],
        )

        # Seed check-in for User B
        checkin_b = CheckIn(
            id=str(uuid.uuid4()),
            user_id=user_b_id,
            mood_score=5,
            mood_label="Great",
            stress_level=1,
            energy_level=9,
            factors=["Exercise", "Vacation"],
            note="User B's vacation note.",
        )

        db_session.add_all([checkin_a, journal_a, checkin_b])
        await db_session.commit()

        # Context for User A
        ctx_a = await ChatContextService.build_user_context(
            user_id=user_a_id,
            conversation_id=None,
            db=db_session,
            settings=settings,
        )
        # Context for User B
        ctx_b = await ChatContextService.build_user_context(
            user_id=user_b_id,
            conversation_id=None,
            db=db_session,
            settings=settings,
        )

        # Verify User A only sees User A's data
        assert "College" in ctx_a["system_context"]
        assert "User A's Private Reflection" in ctx_a["system_context"]
        assert "Vacation" not in ctx_a["system_context"]
        assert "User B's vacation note" not in ctx_a["system_context"]

        # Verify User B only sees User B's data
        assert "Vacation" in ctx_b["system_context"]
        assert "User A's private college stress note" not in ctx_b["system_context"]
        assert "Exhausted" not in ctx_b["system_context"]

    finally:
        await db_session.execute(delete(User).where(User.id.in_([user_a_id, user_b_id])))
        await db_session.commit()


@pytest.mark.asyncio
async def test_context_bounding_and_truncation(db_session: AsyncSession):
    user_id = f"test-trunc-{uuid.uuid4().hex[:8]}"

    try:
        user = User(id=user_id, email=f"{user_id}@test.com", display_name="Test User")
        db_session.add(user)
        await db_session.commit()

        # Seed very long journal entry
        long_content = "Word " * 600  # 3000 chars
        long_journal = JournalEntry(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title="Very Long Reflection",
            content=long_content,
            tags=["Long"],
        )
        db_session.add(long_journal)
        await db_session.commit()

        ctx = await ChatContextService.build_user_context(
            user_id=user_id,
            conversation_id=None,
            db=db_session,
            settings=settings,
        )

        # Verify context size is strictly within limits
        assert len(ctx["system_context"]) <= settings.CHAT_MAX_CONTEXT_CHARS

    finally:
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()
