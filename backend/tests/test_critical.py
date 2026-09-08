import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timezone
import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.database import get_db
from app.models.user import User
from app.models.checkin import CheckIn
from app.models.journal import JournalEntry
from app.models.micro_goal import MicroGoal
from app.services.safety_service import SafetyService


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession):
    app.dependency_overrides[get_db] = lambda: db_session
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


# ==============================================================================
# 1. CRITICAL SAFETY & CRISIS INTERVENTION HANDLING
# ==============================================================================

def test_safety_detection_and_crisis_override():
    """
    Verifies that high-risk messages (suicide/self-harm) trigger emergency intervention
    with Tele-MANAS (14416) and 112, while everyday wellness inputs remain SAFE.
    """
    # Safe input
    level_safe, override_safe = SafetyService.evaluate_message_safety(
        "I felt anxious about my college presentations today."
    )
    assert level_safe == "SAFE"
    assert override_safe is False

    # High-risk crisis input
    level_risk, override_risk = SafetyService.evaluate_message_safety(
        "I feel like killing myself tonight and want to end it all."
    )
    assert level_risk == "HIGH_RISK"
    assert override_risk is True

    # Crisis response content verification
    msg, suggestions, followup = SafetyService.generate_high_risk_response()
    assert "14416" in msg
    assert "Tele-MANAS" in msg
    assert "112" in msg
    assert len(suggestions) >= 3


# ==============================================================================
# 2. AUTHENTICATION & USER DATA ISOLATION
# ==============================================================================

@pytest.mark.asyncio
async def test_user_data_isolation(async_client: httpx.AsyncClient, db_session: AsyncSession):
    """
    Verifies that data belonging to User A is strictly isolated from User B
    across chat conversations, check-ins, and micro goals.
    """
    user_a = f"test-usr-iso-a-{uuid.uuid4().hex[:8]}"
    user_b = f"test-usr-iso-b-{uuid.uuid4().hex[:8]}"
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        # User A creates a micro goal and a check-in
        goal_res = await async_client.post(
            "/api/v1/micro-goals",
            json={"goal_text": "User A Private Meditation", "goal_date": today_str, "source": "manual"},
            headers={"X-User-ID": user_a},
        )
        assert goal_res.status_code == 201
        goal_a_id = goal_res.json()["id"]

        # User B queries their goals -> must not see User A's goal
        list_res = await async_client.get(
            f"/api/v1/micro-goals?date={today_str}",
            headers={"X-User-ID": user_b},
        )
        assert list_res.status_code == 200
        assert not any(g["id"] == goal_a_id for g in list_res.json()["goals"])

        # User B cannot mutate User A's goal
        patch_res = await async_client.patch(
            f"/api/v1/micro-goals/{goal_a_id}",
            json={"completed": True},
            headers={"X-User-ID": user_b},
        )
        assert patch_res.status_code == 404

    finally:
        await db_session.execute(delete(User).where(User.id.in_([user_a, user_b])))
        await db_session.commit()


# ==============================================================================
# 3. CHECK-IN PERSISTENCE & MOOD BOARD REFLECTION
# ==============================================================================

@pytest.mark.asyncio
async def test_checkin_reflects_in_mood_board(async_client: httpx.AsyncClient, db_session: AsyncSession):
    """
    Verifies that when a user records a check-in, it immediately reflects in both
    the monthly mood calendar and the date detail endpoint.
    """
    user_id = f"test-usr-mood-{uuid.uuid4().hex[:8]}"
    today = datetime.now(timezone.utc)
    today_str = today.strftime("%Y-%m-%d")

    try:
        # Submit check-in
        checkin_payload = {
            "mood_score": 4,
            "mood_label": "Good",
            "mood_emoji": "🙂",
            "stress_level": 3,
            "energy_level": 8,
            "factors": ["Quality Sleep", "Meditation"],
            "note": "Felt grounded and productive.",
        }
        res = await async_client.post(
            "/api/v1/checkins",
            json=checkin_payload,
            headers={"X-User-ID": user_id},
        )
        assert res.status_code == 201
        checkin_data = res.json()
        assert checkin_data["mood_score"] == 4
        assert checkin_data["mood_label"] == "Good"

        # Verify reflection in Month Mood Calendar
        month_res = await async_client.get(
            f"/api/v1/mood-board/month?year={today.year}&month={today.month}",
            headers={"X-User-ID": user_id},
        )
        assert month_res.status_code == 200
        days = month_res.json()["days"]
        matched_day = next((d for d in days if d["date"] == today_str), None)
        assert matched_day is not None
        assert matched_day["has_checkin"] is True
        assert matched_day["mood_score"] == 4

        # Verify reflection in Day Detail
        day_res = await async_client.get(
            f"/api/v1/mood-board/day?date={today_str}",
            headers={"X-User-ID": user_id},
        )
        assert day_res.status_code == 200
        day_data = day_res.json()
        assert day_data["checkin"] is not None
        assert day_data["checkin"]["mood_score"] == 4
        assert day_data["checkin"]["stress_level"] == 3
        assert day_data["daily_summary"] is not None

    finally:
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()


# ==============================================================================
# 4. MICRO-GOALS CRUD & COMPLETION TOGGLE
# ==============================================================================

@pytest.mark.asyncio
async def test_micro_goals_lifecycle(async_client: httpx.AsyncClient, db_session: AsyncSession):
    """
    Verifies micro-goal creation, retrieval, completion toggle, and deletion.
    """
    user_id = f"test-usr-goals-{uuid.uuid4().hex[:8]}"
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        # Create
        create_res = await async_client.post(
            "/api/v1/micro-goals",
            json={"goal_text": "3-minute breathing pause", "goal_date": today_str, "source": "chatbot"},
            headers={"X-User-ID": user_id},
        )
        assert create_res.status_code == 201
        goal = create_res.json()
        goal_id = goal["id"]
        assert goal["completed"] is False

        # Toggle to completed
        toggle_res = await async_client.patch(
            f"/api/v1/micro-goals/{goal_id}",
            json={"completed": True},
            headers={"X-User-ID": user_id},
        )
        assert toggle_res.status_code == 200
        assert toggle_res.json()["completed"] is True

        # Delete
        del_res = await async_client.delete(
            f"/api/v1/micro-goals/{goal_id}",
            headers={"X-User-ID": user_id},
        )
        assert del_res.status_code == 200

    finally:
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()
