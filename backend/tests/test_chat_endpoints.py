import pytest
import pytest_asyncio
import uuid
import httpx
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User
from app.database import get_db


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession):
    app.dependency_overrides[get_db] = lambda: db_session
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_normal_chat_message_flow(async_client: httpx.AsyncClient, db_session: AsyncSession):
    user_id = f"test-usr-flow-{uuid.uuid4().hex[:8]}"
    try:
        response = await async_client.post(
            "/api/v1/chat",
            headers={"X-User-ID": user_id},
            json={"message": "I'm feeling stressed about my upcoming presentation."},
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert "message" in data
        assert "suggestions" in data
        assert data["safety_level"] in ["SAFE", "CONCERNING"]
        conv_id = data["conversation_id"]

        # Verify conversation is persisted and listed
        list_res = await async_client.get(
            "/api/v1/chat/conversations",
            headers={"X-User-ID": user_id},
        )
        assert list_res.status_code == 200
        convs = list_res.json()
        assert any(c["id"] == conv_id for c in convs)

        # Verify conversation detail
        detail_res = await async_client.get(
            f"/api/v1/chat/conversations/{conv_id}",
            headers={"X-User-ID": user_id},
        )
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["id"] == conv_id
        assert len(detail_data["messages"]) >= 2

    finally:
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()


@pytest.mark.asyncio
async def test_high_risk_immediate_safety_intervention(async_client: httpx.AsyncClient, db_session: AsyncSession):
    user_id = f"test-usr-risk-{uuid.uuid4().hex[:8]}"
    try:
        response = await async_client.post(
            "/api/v1/chat",
            headers={"X-User-ID": user_id},
            json={"message": "I want to end my life, I cannot take this anymore."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["safety_level"] == "HIGH_RISK"
        assert "14416" in data["message"]
        assert "Tele-MANAS" in data["message"]
        assert "112" in data["message"]
    finally:
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()


@pytest.mark.asyncio
async def test_cross_user_isolation_on_conversations(async_client: httpx.AsyncClient, db_session: AsyncSession):
    user_a_id = f"test-usr-iso-a-{uuid.uuid4().hex[:8]}"
    user_b_id = f"test-usr-iso-b-{uuid.uuid4().hex[:8]}"

    try:
        # User A creates a conversation
        res_a = await async_client.post(
            "/api/v1/chat",
            headers={"X-User-ID": user_a_id},
            json={"message": "User A secret reflection message."},
        )
        conv_id_a = res_a.json()["conversation_id"]

        # User B attempts to fetch User A's conversation -> should be 404
        res_b_get = await async_client.get(
            f"/api/v1/chat/conversations/{conv_id_a}",
            headers={"X-User-ID": user_b_id},
        )
        assert res_b_get.status_code == 404

        # User B attempts to delete User A's conversation -> should be 404
        res_b_del = await async_client.delete(
            f"/api/v1/chat/conversations/{conv_id_a}",
            headers={"X-User-ID": user_b_id},
        )
        assert res_b_del.status_code == 404

    finally:
        await db_session.execute(delete(User).where(User.id.in_([user_a_id, user_b_id])))
        await db_session.commit()


@pytest.mark.asyncio
async def test_invalid_location_coordinates_validation(async_client: httpx.AsyncClient):
    # Latitude > 90
    res = await async_client.post(
        "/api/v1/chat",
        headers={"X-User-ID": "usr-test-val"},
        json={
            "message": "Find therapists near me",
            "latitude": 95.0,
            "longitude": 75.0,
        },
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_crisis_resources_endpoint(async_client: httpx.AsyncClient):
    res = await async_client.get("/api/v1/chat/crisis-resources")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    telemanas = next((r for r in data if "Tele-MANAS" in r["name"]), None)
    assert telemanas is not None
    assert telemanas["phone"] == "14416"
