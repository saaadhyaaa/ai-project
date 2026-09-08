import pytest
from unittest.mock import MagicMock, patch
from app.config import Settings
from app.services.gemini_service import GeminiService
from app.schemas.chat import ChatAIResponse, ProviderCard


@pytest.fixture
def mock_settings():
    return Settings(
        GEMINI_API_KEY="test-mock-api-key",
        GEMINI_MODEL="gemini-3.1-flash-lite",
    )


@pytest.mark.asyncio
async def test_gemini_service_structured_chat(mock_settings):
    svc = GeminiService(settings=mock_settings)

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"message": "I hear you, take a moment to pause.", "suggestions": ["4-7-8 Breathing", "5-minute break"], "follow_up_question": "What is one thing causing the most pressure right now?", "safety_level": "SAFE"}'
    mock_client.models.generate_content.return_value = mock_response

    with patch.object(svc, "_client", mock_client):
        res = await svc.generate_chat_response(
            user_message="I'm feeling so overwhelmed.",
            system_context="",
            history=[],
        )

        assert isinstance(res, ChatAIResponse)
        assert res.message == "I hear you, take a moment to pause."
        assert len(res.suggestions) == 2
        assert res.safety_level == "SAFE"
        assert res.follow_up_question == "What is one thing causing the most pressure right now?"


@pytest.mark.asyncio
async def test_gemini_service_fallback_on_api_error(mock_settings):
    svc = GeminiService(settings=mock_settings)

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("Simulated Gemini API timeout / network down")

    with patch.object(svc, "_client", mock_client):
        res = await svc.generate_chat_response(
            user_message="Hello",
            system_context="",
            history=[],
        )

        assert isinstance(res, ChatAIResponse)
        assert "trouble connecting right now" in res.message
        assert len(res.suggestions) >= 1
        assert res.safety_level == "SAFE"


@pytest.mark.asyncio
async def test_gemini_service_maps_grounding_extraction(mock_settings):
    svc = GeminiService(settings=mock_settings)

    mock_client = MagicMock()
    mock_response = MagicMock()

    # Create mock grounded candidate
    mock_chunk_1 = MagicMock()
    mock_web = MagicMock()
    mock_web.title = "MindCare Counseling Center"
    mock_web.uri = "https://maps.google.com/?cid=12345"
    mock_chunk_1.web = mock_web
    mock_chunk_1.maps = None

    mock_grounding_metadata = MagicMock()
    mock_grounding_metadata.grounding_chunks = [mock_chunk_1]

    mock_candidate = MagicMock()
    mock_candidate.grounding_metadata = mock_grounding_metadata

    mock_response.candidates = [mock_candidate]
    mock_response.text = "Here are grounded providers near your location."
    mock_client.models.generate_content.return_value = mock_response

    with patch.object(svc, "_client", mock_client):
        providers = await svc.search_grounded_providers(
            query="therapist near me",
            latitude=19.0760,
            longitude=72.8777,
        )

        assert len(providers) == 1
        assert providers[0].name == "MindCare Counseling Center"
        assert providers[0].maps_url == "https://maps.google.com/?cid=12345"


@pytest.mark.asyncio
async def test_gemini_service_maps_failure_returns_empty_without_hallucination(mock_settings):
    svc = GeminiService(settings=mock_settings)

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("Maps grounding API unreachable")

    with patch.object(svc, "_client", mock_client):
        providers = await svc.search_grounded_providers(
            query="therapist near me",
            latitude=19.0760,
            longitude=72.8777,
        )

        assert providers == []
