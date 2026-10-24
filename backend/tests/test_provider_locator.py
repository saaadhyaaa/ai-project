import pytest
from app.services.safety_service import SafetyService
from app.schemas.chat import ProviderCard


def test_provider_search_intent_detection():
    """
    Ensures that various phrasings of finding a therapist or mental health clinic
    are accurately identified.
    """
    assert SafetyService.is_provider_search_request("find therapists near me") is True
    assert SafetyService.is_provider_search_request("Find mental health clinics and therapists near me.") is True
    assert SafetyService.is_provider_search_request("Find therapists and counseling centers in Mumbai") is True
    assert SafetyService.is_provider_search_request("I need a psychologist nearby") is True
    assert SafetyService.is_provider_search_request("looking for mental health support in Delhi") is True

    # Everyday reflections should NOT be flagged as provider search
    assert SafetyService.is_provider_search_request("I've been feeling overwhelmed and need a moment to breathe.") is False
    assert SafetyService.is_provider_search_request("Can we reflect on why I feel so drained lately?") is False


def test_location_hint_extraction():
    """
    Verifies that city and area names are correctly extracted from message queries.
    """
    assert SafetyService.extract_location_from_text("Find therapists in Mumbai") == "Mumbai"
    assert SafetyService.extract_location_from_text("Counseling centers around Bengaluru") == "Bengaluru"
    assert SafetyService.extract_location_from_text("therapists near Delhi") == "Delhi"

    # Non-locations should not be extracted
    assert SafetyService.extract_location_from_text("find therapists near me") is None
    assert SafetyService.extract_location_from_text("counselors in my area") is None


def test_curated_fallback_providers():
    """
    Verifies that the verified fallback provider directory delivers real clinics.
    """
    mumbai_providers = SafetyService.get_fallback_providers("Mumbai")
    assert len(mumbai_providers) >= 3
    assert all(isinstance(p, ProviderCard) for p in mumbai_providers)
    assert any("Masina Hospital" in p.name or "TISS" in p.name for p in mumbai_providers)

    default_providers = SafetyService.get_fallback_providers(None)
    assert len(default_providers) >= 3
    assert any("Tele-MANAS" in p.name for p in default_providers)
