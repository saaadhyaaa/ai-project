import re
from typing import List, Tuple, Dict, Any
from app.schemas.chat import CrisisResource, ProviderCard

# Centralized crisis resources with focus on India + Global fallbacks
INDIA_CRISIS_RESOURCES: List[Dict[str, Any]] = [
    {
        "name": "Tele-MANAS (Govt. of India)",
        "category": "Mental Health Crisis Hotline",
        "phone": "14416",
        "url": "https://telemanas.mohfw.gov.in",
        "description": "24/7 free, confidential mental health helpline available in multiple Indian languages.",
        "country": "India",
    },
    {
        "name": "Vandrevala Foundation Helpline",
        "category": "Emotional Support & Suicide Prevention",
        "phone": "+91 9999 666 555",
        "url": "https://www.vandrevalafoundation.com",
        "description": "24/7 free counseling and suicide prevention service across India.",
        "country": "India",
    },
    {
        "name": "KIRAN Mental Health Helpline",
        "category": "Mental Health Support",
        "phone": "1800-599-0019",
        "url": "https://depwd.gov.in",
        "description": "24/7 toll-free helpline by the Ministry of Social Justice and Empowerment.",
        "country": "India",
    },
    {
        "name": "National Emergency Services (India)",
        "category": "Emergency Services",
        "phone": "112",
        "description": "All-in-one emergency number (Police, Fire, Ambulance) in India.",
        "country": "India",
    },
]

GLOBAL_CRISIS_DIRECTORY = {
    "name": "Find A Helpline (International)",
    "category": "Global Support Directory",
    "url": "https://findahelpline.com",
    "description": "Free, confidential crisis support in over 130 countries.",
    "country": "Global",
}

# High-Risk regex patterns for immediate deterministic detection
HIGH_RISK_PATTERNS = [
    r"\b(suicid(e|al)|kill(ing)?\s+myself|end(ing)?\s+my\s+life|want\s+to\s+die|wish\s+i\s+was\s+dead)\b",
    r"\b(self[\s-]harm|cut(ting)?\s+my\s+(wrist|arm|skin)|overdos(e|ing)|hang(ing)?\s+myself)\b",
    r"\b(better\s+off\s+dead|no\s+reason\s+to\s+live|don'?t\s+want\s+to\s+wake\s+up)\b",
    r"\b(jump(ing)?\s+off\s+(a\s+bridge|a\s+building|the\s+roof))\b",
]

# Concerning patterns that warrant gentle vigilance and practical grounding
CONCERNING_PATTERNS = [
    r"\b(can'?t\s+take\s+this\s+anymore|everything\s+is\s+hopeless|feel\s+like\s+giving\s+up)\b",
    r"\b(panic\s+attack|can'?t\s+breathe|severe\s+breakdown|so\s+alone|nobody\s+cares)\b",
    r"\b(numb|completely\s+empty|falling\s+apart)\b",
]

# Provider search intent keywords (with plurals and flexibilities)
PROVIDER_SEARCH_PATTERNS = [
    r"\b(therapist|therapists|psychologist|psychologists|psychiatrist|psychiatrists|counselor|counselors|counsellor|counsellors)\s+(near|around|in|close\s+to)\s+(me|my\s+area|here)\b",
    r"\b(mental\s+health\s+clinic|mental\s+health\s+clinics|counseling\s+center|counseling\s+centers|therapy\s+clinic|therapy\s+clinics|psychology\s+clinic|psychiatry\s+clinic)\s+(near|around|in|close\s+to)\s+(me|my\s+area|here)\b",
    r"\b(find|search|look\s+for|recommend|locate)\s+(a\s+|an\s+|some\s+)?(therapist|therapists|counselor|counselors|psychologist|psychologists|psychiatrist|psychiatrists|clinic|clinics)\b",
    r"\b(someone\s+to\s+talk\s+to\s+professionally|professional\s+help\s+nearby|professional\s+mental\s+health\s+help)\b",
    r"\b(therapist|psychologist|psychiatrist|counselor|clinic)\s+near\s+me\b",
]


class SafetyService:
    """
    Deterministic backend safety service to ensure immediate crisis intervention
    regardless of external LLM responses, while strictly isolating sensitive queries.
    """

    @staticmethod
    def evaluate_message_safety(text: str) -> Tuple[str, bool]:
        """
        Evaluates input text deterministically.
        Returns: (safety_level, is_immediate_override)
        safety_level: 'HIGH_RISK', 'CONCERNING', or 'SAFE'
        """
        normalized = text.lower()

        # Check High-Risk patterns
        for pattern in HIGH_RISK_PATTERNS:
            if re.search(pattern, normalized):
                return "HIGH_RISK", True

        # Check Concerning patterns
        for pattern in CONCERNING_PATTERNS:
            if re.search(pattern, normalized):
                return "CONCERNING", False

        return "SAFE", False

    @staticmethod
    def is_provider_search_request(text: str) -> bool:
        """
        Checks whether the user's message is asking for nearby professional care or clinics.
        """
        normalized = text.lower()
        for pattern in PROVIDER_SEARCH_PATTERNS:
            if re.search(pattern, normalized):
                return True
        return False

    @staticmethod
    def get_crisis_resources() -> List[CrisisResource]:
        """
        Returns the list of curated crisis resources.
        """
        resources = [CrisisResource(**r) for r in INDIA_CRISIS_RESOURCES]
        resources.append(CrisisResource(**GLOBAL_CRISIS_DIRECTORY))
        return resources

    @staticmethod
    def generate_high_risk_response() -> Tuple[str, List[str], str]:
        """
        Generates an immediate compassionate safety response for high-risk situations.
        """
        message = (
            "I hear how much pain you are carrying right now, and I want you to know you are not alone. "
            "Because your safety is the most important thing, please connect with someone who can support you right this minute.\n\n"
            "• In India, call **Tele-MANAS** at **14416** (24/7 toll-free) or **Vandrevala Foundation** at **+91 9999 666 555**.\n"
            "• For immediate physical emergency, dial **112**.\n"
            "• If outside India, you can find local help anytime at [findahelpline.com](https://findahelpline.com).\n\n"
            "Please reach out to a trusted friend, family member, or healthcare professional right now. We are here with you."
        )
        suggestions = [
            "Call Tele-MANAS (14416)",
            "Call Vandrevala Helpline (+91 9999 666 555)",
            "Reach out to someone I trust",
            "Try a grounding breath",
        ]
        follow_up = "Would you like me to guide you through a gentle grounding exercise while you reach out?"
        return message, suggestions, follow_up
