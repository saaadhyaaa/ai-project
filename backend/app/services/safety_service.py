import re
from typing import List, Tuple, Dict, Any, Optional
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
    r"\b(find|search|look\s+for|recommend|locate|need|want|get)\s+(a\s+|an\s+|some\s+)?(therapist|therapists|counselor|counselors|counsellor|counsellors|psychologist|psychologists|psychiatrist|psychiatrists|clinic|clinics|therapy|psychotherapy)\b",
    r"\b(someone\s+to\s+talk\s+to\s+professionally|professional\s+help\s+nearby|professional\s+mental\s+health\s+help)\b",
    r"\b(therapist|psychologist|psychiatrist|counselor|counsellor|clinic)\s+near\s+me\b",
    r"\b(find|need|looking\s+for)\s+(mental\s+health\s+support|counseling|therapy)\b",
    r"\btherapist\s+near\s+me\b",
    r"\btherapists\s+near\s+me\b",
]

# Verified curated providers fallback directory
VERIFIED_FALLBACK_PROVIDERS: Dict[str, List[Dict[str, Any]]] = {
    "mumbai": [
        {
            "name": "Tata Institute of Social Sciences (iCall Counseling)",
            "description": "Premier national psychosocial helpline and mental health counseling service.",
            "address": "VN Purav Marg, Deonar, Mumbai, Maharashtra 400088",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=TISS+iCall+Deonar+Mumbai",
        },
        {
            "name": "Masina Hospital - Department of Psychiatry",
            "description": "Reputed hospital providing comprehensive inpatient & outpatient psychiatric and psychological care.",
            "address": "Sant Savta Marg, Byculla East, Mumbai, Maharashtra 400027",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=Masina+Hospital+Psychiatry+Byculla+Mumbai",
        },
        {
            "name": "Kokilaben Dhirubhai Ambani Hospital - Center for Mental Health",
            "description": "Specialized multi-disciplinary mental health center with licensed psychologists and psychiatrists.",
            "address": "Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai, Maharashtra 400053",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=Kokilaben+Hospital+Mental+Health+Andheri+West+Mumbai",
        },
        {
            "name": "Jaslok Hospital & Research Centre - Psychiatry",
            "description": "Leading hospital department offering psychological counseling, psychometry, and mental health support.",
            "address": "15, Deshmukh Marg, Tardeo, Mumbai, Maharashtra 400026",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=Jaslok+Hospital+Psychiatry+Tardeo+Mumbai",
        },
    ],
    "delhi": [
        {
            "name": "VIMHANS (Vidyasagar Institute of Mental Health and Neurosciences)",
            "description": "Specialized multi-specialty institute for mental health, psychotherapy, and psychiatric rehabilitation.",
            "address": "1, Institutional Area, Nehru Nagar, New Delhi, Delhi 110065",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=VIMHANS+Nehru+Nagar+New+Delhi",
        },
        {
            "name": "AIIMS Department of Psychiatry",
            "description": "Apex government healthcare institution offering state-of-the-art clinical psychology and psychiatry.",
            "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=AIIMS+Psychiatry+Ansari+Nagar+New+Delhi",
        },
        {
            "name": "Fortis Mental Health & Behavioural Sciences",
            "description": "Comprehensive psychological counseling, psychotherapy, and youth mental health programs.",
            "address": "Sector B, Pocket 1, Aruna Asaf Ali Marg, Vasant Kunj, New Delhi 110070",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=Fortis+Mental+Health+Vasant+Kunj+New+Delhi",
        },
    ],
    "bangalore": [
        {
            "name": "NIMHANS (National Institute of Mental Health and Neurosciences)",
            "description": "India's premier institute for mental health, psychiatric treatment, and clinical psychology.",
            "address": "Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=NIMHANS+Hosur+Road+Bengaluru",
        },
        {
            "name": "NIMHANS Centre for Well-Being (NCWB)",
            "description": "Community mental health and counseling facility focusing on emotional wellness and psychotherapy.",
            "address": "1/B, 9th Main Road, 1st Block, Jayanagar, Bengaluru, Karnataka 560011",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=NIMHANS+Centre+for+Well-Being+Jayanagar+Bengaluru",
        },
        {
            "name": "Spandana Health Care - Mental Health Care",
            "description": "Dedicated psychiatric hospital and rehabilitation center providing psychological therapies.",
            "address": "Nandini Layout, Bengaluru, Karnataka 560096",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=Spandana+Healthcare+Nandini+Layout+Bengaluru",
        },
    ],
    "bengaluru": [
        {
            "name": "NIMHANS (National Institute of Mental Health and Neurosciences)",
            "description": "India's premier institute for mental health, psychiatric treatment, and clinical psychology.",
            "address": "Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=NIMHANS+Hosur+Road+Bengaluru",
        },
        {
            "name": "NIMHANS Centre for Well-Being (NCWB)",
            "description": "Community mental health and counseling facility focusing on emotional wellness and psychotherapy.",
            "address": "1/B, 9th Main Road, 1st Block, Jayanagar, Bengaluru, Karnataka 560011",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=NIMHANS+Centre+for+Well-Being+Jayanagar+Bengaluru",
        },
        {
            "name": "Spandana Health Care - Mental Health Care",
            "description": "Dedicated psychiatric hospital and rehabilitation center providing psychological therapies.",
            "address": "Nandini Layout, Bengaluru, Karnataka 560096",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=Spandana+Healthcare+Nandini+Layout+Bengaluru",
        },
    ],
    "default": [
        {
            "name": "Tele-MANAS (Govt. of India 24/7 Mental Health Care)",
            "description": "National 24/7 free mental health counseling helpline operated by NIMHANS and Ministry of Health.",
            "address": "National Tele-Mental Health Programme (Dial 14416)",
            "maps_url": "https://telemanas.mohfw.gov.in",
        },
        {
            "name": "Vandrevala Foundation Mental Health Counseling",
            "description": "24/7 free clinical counseling and psychological support by trained professionals across India.",
            "address": "Available Pan-India (Dial +91 9999 666 555)",
            "maps_url": "https://www.vandrevalafoundation.com",
        },
        {
            "name": "KIRAN National Mental Health Helpline",
            "description": "Toll-free 24/7 mental health service by the Ministry of Social Justice and Empowerment.",
            "address": "Toll-free 1800-599-0019 (Multi-lingual support)",
            "maps_url": "https://depwd.gov.in",
        },
        {
            "name": "TISS iCall Psychosocial Helpline",
            "description": "Professional counseling service by Tata Institute of Social Sciences covering relationships, stress, and anxiety.",
            "address": "Deonar, Mumbai (Available Pan-India via phone & email)",
            "maps_url": "https://icallhelpline.org",
        },
    ],
}


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
    def extract_location_from_text(text: str) -> Optional[str]:
        """
        Extracts potential location hints from messages such as:
        'find therapists in Mumbai', 'counseling centers around Bangalore', etc.
        """
        match = re.search(r"\b(?:in|around|near|at)\s+([A-Za-z\s]{3,30})(?:[.,?!]|$)", text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Exclude non-location words
            if candidate.lower() not in {"me", "my area", "here", "town", "the city", "my city", "us"}:
                return candidate
        return None

    @staticmethod
    def get_fallback_providers(location_hint: Optional[str] = None) -> List[ProviderCard]:
        """
        Returns verified fallback provider cards for a given location or national directory.
        """
        if location_hint:
            loc_key = location_hint.strip().lower()
            for key in VERIFIED_FALLBACK_PROVIDERS:
                if key != "default" and key in loc_key:
                    return [ProviderCard(**p) for p in VERIFIED_FALLBACK_PROVIDERS[key]]

        return [ProviderCard(**p) for p in VERIFIED_FALLBACK_PROVIDERS["default"]]

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
