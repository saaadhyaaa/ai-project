import json
import logging
import asyncio
import urllib.parse
from typing import List, Optional, Tuple, Dict, Any

import httpx
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import Settings
from app.schemas.chat import ChatAIResponse, ProviderCard, ProviderCardList
from app.services.safety_service import SafetyService

logger = logging.getLogger("mindease.gemini")

SYSTEM_INSTRUCTION = """
You are MindEase, a warm, thoughtful, and compassionate AI Emotional Wellness Companion.
Your purpose is to listen with deep empathy, validate the user's emotional experience, and offer gentle, practical, bite-sized coping support.

Guidelines:
1. Tone & Style: Warm, calm, concise, grounded, and non-judgmental. Keep responses easy to read (1-3 brief paragraphs).
2. Persona & Boundaries:
   - You are a wellness companion, NOT a therapist, psychologist, psychiatrist, or medical doctor.
   - NEVER diagnose any mental illness or physical condition.
   - NEVER prescribe medication, clinical treatments, or medical interventions.
   - When the user asks to find a therapist, counselor, clinic, or professional care:
     * Warmly commend and validate their proactive step in seeking professional guidance.
     * Clarify that while you offer daily emotional companion and grounding support, licensed therapists provide personalized clinical treatment.
     * Reassure the user and direct their attention to the local care provider cards and verified clinics displayed directly below your message on their screen.
3. Practical Wellness & Calming Practices:
   - MindEase includes a dedicated 'Calm & Reset' toolkit featuring 5 specific breathing exercises:
     * 4-7-8 Breathing (for easing anxiety, racing thoughts, sleep preparation)
     * Box Breathing (for resetting focus and calming acute stress)
     * Equal Breathing (for emotional balance and presence)
     * Deep Breathing (for lowering heart rate and muscle tension)
     * Extended Exhale (for rapid nervous system down-regulation)
     * 2-Minute Quick Reset (for quick workday/study pauses)
     * Gentle Soundscapes (Rain, Ocean Waves, Forest Breeze, Gentle Piano, Ambient Calm)
   - When the user is stressed, anxious, or overwhelmed, suggest one of these exact practices (e.g. in suggestions array: ["Try 4-7-8 Breathing", "Practice Box Breathing", "2-Minute Quick Reset", "Calm & Reset"]).
   - Avoid generic motivational cliches or recommending non-existent meditation techniques.
4. Using User Context:
   - If the user's MindEase check-in trends or journal themes are provided, reference them naturally and gently without making clinical assertions.
5. Structured Output:
   - Always return valid JSON matching the schema:
     - 'message': your supportive conversational response.
     - 'suggestions': array of 2-4 short, clickable action phrases (e.g., ["4-7-8 Breath", "Break into small steps", "Gentle self-check"]).
     - 'follow_up_question': optional gentle, open inquiry to encourage deeper reflection.
     - 'safety_level': 'SAFE', 'CONCERNING', or 'HIGH_RISK'.
"""

FALLBACK_MESSAGE = (
    "I'm having a little trouble connecting right now, but please know that you are supported. "
    "For this moment, try pausing for one slow breath, unclench your shoulders, and pick just one small thing you can control right now."
)


class GeminiService:
    """
    Centralized service for interacting with Google Gemini models using the
    official Google GenAI Python SDK (`google-genai`), structured output validation,
    and conditional Google Maps Grounding.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: Optional[genai.Client] = None

    @property
    def client(self) -> Optional[genai.Client]:
        if not self._client and self.settings.GEMINI_API_KEY:
            try:
                self._client = genai.Client(api_key=self.settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI Client: {type(e).__name__}")
        return self._client

    async def generate_chat_response(
        self,
        user_message: str,
        system_context: str,
        history: List[Dict[str, Any]],
    ) -> ChatAIResponse:
        """
        Generates a structured emotional support response from Gemini.
        Applies exponential backoff for transient errors and returns safe fallback on failure.
        """
        if not self.client:
            logger.warning("Gemini API key not configured. Returning graceful fallback.")
            return ChatAIResponse(
                message=FALLBACK_MESSAGE,
                suggestions=["Take a slow breath", "Hydrate and rest", "Write down thoughts"],
                follow_up_question="Would you like to explore what feels heaviest right now?",
                safety_level="SAFE",
            )

        prompt_content = user_message
        full_system_instruction = SYSTEM_INSTRUCTION
        if system_context.strip():
            full_system_instruction += f"\n\n--- Authenticated User Context ---\n{system_context}"

        # Prepare contents array with history
        contents = []
        for msg in history:
            role = msg.get("role", "user")
            parts = [types.Part.from_text(text=p.get("text", "")) for p in msg.get("parts", [])]
            contents.append(types.Content(role=role, parts=parts))

        # Append current user prompt
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt_content)]))

        config = types.GenerateContentConfig(
            system_instruction=full_system_instruction,
            response_mime_type="application/json",
            response_schema=ChatAIResponse,
            max_output_tokens=self.settings.CHAT_MAX_OUTPUT_TOKENS,
            temperature=0.7,
        )

        model_name = self.settings.GEMINI_MODEL or "gemini-3.1-flash-lite"

        # Retry loop for transient issues
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=model_name,
                    contents=contents,
                    config=config,
                )

                if response and response.text:
                    try:
                        data = json.loads(response.text)
                        return ChatAIResponse(**data)
                    except Exception as parse_err:
                        logger.warning(f"Error parsing structured JSON output: {parse_err}. Raw: {response.text[:100]}")
                        # Fallback parsing
                        return ChatAIResponse(
                            message=response.text,
                            suggestions=["Take a 5-minute pause", "Write a reflection", "Drink some water"],
                            follow_up_question=None,
                            safety_level="SAFE",
                        )
                break
            except APIError as api_err:
                logger.warning(f"Gemini APIError on attempt {attempt + 1}: {api_err.message if hasattr(api_err, 'message') else api_err}")
                if attempt < max_retries:
                    await asyncio.sleep(1.0 * (2 ** attempt))
                else:
                    break
            except Exception as e:
                logger.error(f"Unexpected error in Gemini chat call: {type(e).__name__}")
                if attempt < max_retries:
                    await asyncio.sleep(1.0 * (2 ** attempt))
                else:
                    break

        return ChatAIResponse(
            message=FALLBACK_MESSAGE,
            suggestions=["Take a deep breath", "Step away for 5 minutes", "Reflect on one small goal"],
            follow_up_question=None,
            safety_level="SAFE",
        )

    async def _reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        Attempts to reverse geocode lat/lng to a city or district name using
        OpenStreetMap Nominatim with a short timeout.
        """
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            headers = {"User-Agent": "MindEaseApp/1.0 (Emotional Well-Being Companion)"}
            params = {"lat": lat, "lon": lng, "format": "json"}
            async with httpx.AsyncClient(timeout=2.5, headers=headers) as http_client:
                resp = await http_client.get(url, params=params)
                if resp.status_code == 200:
                    addr = resp.json().get("address", {})
                    city = (
                        addr.get("city")
                        or addr.get("town")
                        or addr.get("suburb")
                        or addr.get("city_district")
                        or addr.get("state_district")
                        or addr.get("state")
                    )
                    country = addr.get("country", "")
                    if city:
                        return f"{city}, {country}" if country else city
        except Exception as e:
            logger.debug(f"Reverse geocode skipped: {type(e).__name__}")
        return None

    async def search_grounded_providers(
        self,
        query: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        location_query: Optional[str] = None,
    ) -> List[ProviderCard]:
        """
        Finds verified, real mental health professionals/clinics near the user's location.
        Resilient multi-tiered strategy:
        1. Resolves city or neighborhood name from explicit input, reverse-geocoding, or text.
        2. Tries Google Maps Grounding via Gemini if enabled and quota is available.
        3. Falls back to Gemini structured extraction with ProviderCardList schema.
        4. Seamlessly falls back to curated verified directory so the user is never left without resources.
        """
        target_location = location_query

        # If coordinates provided but no location text, reverse geocode
        if not target_location and latitude is not None and longitude is not None:
            target_location = await self._reverse_geocode(latitude, longitude)

        # If still no location, check if query contains a location hint
        if not target_location:
            target_location = SafetyService.extract_location_from_text(query)

        area_desc = target_location or "the user's area"

        # Tier 1: Try Google Maps Grounding tool via Gemini
        if self.client:
            try:
                search_prompt = (
                    f"Find real, currently active mental health clinics, counseling centers, psychologists, "
                    f"psychiatrists, or licensed therapists near {area_desc}. "
                    f"User request: '{query}'. "
                    f"Return only places grounded in Google Maps data. "
                    f"Do NOT invent or fabricate any clinic names, addresses, or URLs."
                )

                tools = [types.Tool(google_maps=types.GoogleMaps())]
                tool_config = None

                if latitude is not None and longitude is not None:
                    tool_config = types.ToolConfig(
                        retrieval_config=types.RetrievalConfig(
                            lat_lng=types.LatLng(latitude=latitude, longitude=longitude)
                        )
                    )

                config = types.GenerateContentConfig(
                    system_instruction="You are a locator tool extracting real, verified mental health providers using Google Maps Grounding.",
                    tools=tools,
                    tool_config=tool_config,
                    temperature=0.2,
                )

                model_name = self.settings.GEMINI_MODEL or "gemini-3.1-flash-lite"

                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=model_name,
                    contents=search_prompt,
                    config=config,
                )

                providers: List[ProviderCard] = []

                if response and response.candidates:
                    candidate = response.candidates[0]
                    grounding_metadata = getattr(candidate, "grounding_metadata", None)

                    if grounding_metadata:
                        grounding_chunks = getattr(grounding_metadata, "grounding_chunks", []) or []
                        for chunk in grounding_chunks:
                            web = getattr(chunk, "web", None)
                            maps = getattr(chunk, "maps", None) or getattr(chunk, "place", None)

                            title = None
                            uri = None
                            if web:
                                title = getattr(web, "title", None)
                                uri = getattr(web, "uri", None)
                            elif maps:
                                title = getattr(maps, "title", None) or getattr(maps, "name", None)
                                uri = getattr(maps, "uri", None) or getattr(maps, "url", None)

                            if title:
                                search_query = urllib.parse.quote_plus(f"{title} {area_desc}")
                                providers.append(
                                    ProviderCard(
                                        name=title,
                                        maps_url=uri or f"https://www.google.com/maps/search/?api=1&query={search_query}",
                                        place_id=None,
                                        description="Verified provider via Google Maps Grounding",
                                        address=None,
                                    )
                                )

                if providers:
                    return providers[:5]

            except Exception as maps_err:
                logger.info(f"Maps Grounding tool unavailable ({type(maps_err).__name__}). Using Gemini structured provider locator.")

            # Tier 2: Gemini Structured Output Provider Extraction
            try:
                extraction_prompt = (
                    f"List 4 to 5 well-known, real, currently active mental health clinics, counseling centers, "
                    f"psychology centers, or hospital psychiatric departments in or near {area_desc}. "
                    f"Never invent fictional clinics or doctors. Provide real clinic names, concise descriptions, "
                    f"and approximate physical neighborhoods or addresses."
                )

                extract_config = types.GenerateContentConfig(
                    system_instruction=(
                        "You are a locator tool extracting real, verified mental health providers, psychiatric "
                        "departments, and counseling centers. Never invent fictional clinics."
                    ),
                    response_mime_type="application/json",
                    response_schema=ProviderCardList,
                    temperature=0.2,
                )

                model_name = self.settings.GEMINI_MODEL or "gemini-3.1-flash-lite"

                res = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=model_name,
                    contents=extraction_prompt,
                    config=extract_config,
                )

                if res and res.text:
                    parsed = json.loads(res.text)
                    extracted_list = parsed.get("providers", [])
                    result_cards: List[ProviderCard] = []
                    for item in extracted_list:
                        name = item.get("name", "").strip()
                        if not name:
                            continue
                        addr = item.get("address")
                        desc = item.get("description") or "Mental health and counseling services"
                        maps_url = item.get("maps_url")
                        if not maps_url or "maps.app.goo.gl" in maps_url or "google.com/maps" not in maps_url:
                            query_str = f"{name} {addr or area_desc}"
                            maps_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(query_str)}"
                        result_cards.append(
                            ProviderCard(
                                name=name,
                                maps_url=maps_url,
                                place_id=item.get("place_id"),
                                description=desc,
                                address=addr,
                            )
                        )

                    if result_cards:
                        return result_cards[:5]

            except Exception as gen_err:
                logger.warning(f"Gemini structured provider search error: {type(gen_err).__name__}")

        # Tier 3: Curated verified directory fallback
        logger.info(f"Using verified curated provider fallback for {area_desc}.")
        return SafetyService.get_fallback_providers(target_location)[:5]

    async def summarize_conversation(
        self,
        current_summary: Optional[str],
        messages: List[Dict[str, str]],
    ) -> Optional[str]:
        """
        Creates a compact 2-3 sentence rolling summary of older conversation history.
        """
        if not self.client or not messages:
            return current_summary

        history_text = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
        prompt = (
            f"Existing summary: {current_summary or 'None'}\n\n"
            f"Recent messages to summarize:\n{history_text}\n\n"
            "Summarize the key emotional topics, personal stressors, and coping steps in 2-3 concise sentences. "
            "Avoid sensitive private details or exact coordinates."
        )

        try:
            config = types.GenerateContentConfig(
                max_output_tokens=200,
                temperature=0.3,
            )
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.settings.GEMINI_MODEL or "gemini-3.1-flash-lite",
                contents=prompt,
                config=config,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Failed to summarize conversation: {type(e).__name__}")

        return current_summary
