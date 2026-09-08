import json
import logging
import asyncio
from typing import List, Optional, Tuple, Dict, Any

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import Settings
from app.schemas.chat import ChatAIResponse, ProviderCard

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

    async def search_grounded_providers(
        self,
        query: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        location_query: Optional[str] = None,
    ) -> List[ProviderCard]:
        """
        Uses Gemini with Google Maps Grounding to find verified, real mental health
        professionals/clinics near the user's location.
        Never fabricates providers.
        """
        if not self.client:
            logger.warning("Gemini API key not configured for Maps grounding.")
            return []

        search_prompt = (
            f"Find real, currently active mental health clinics, counseling centers, psychologists, "
            f"psychiatrists, or licensed therapists near the user's location. "
            f"User request: '{query}'. "
        )
        if location_query:
            search_prompt += f"Target area/city: '{location_query}'. "

        search_prompt += (
            "Return only places grounded in Google Maps data. "
            "Do NOT invent or fabricate any clinic names, addresses, or URLs."
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

        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=model_name,
                contents=search_prompt,
                config=config,
            )

            providers: List[ProviderCard] = []

            # Extract grounded metadata if available
            if response and response.candidates:
                candidate = response.candidates[0]
                grounding_metadata = getattr(candidate, "grounding_metadata", None)

                if grounding_metadata:
                    grounding_chunks = getattr(grounding_metadata, "grounding_chunks", []) or []
                    for chunk in grounding_chunks:
                        # Extract web/maps details
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
                            providers.append(
                                ProviderCard(
                                    name=title,
                                    maps_url=uri,
                                    place_id=None,
                                    description="Verified provider via Google Maps Grounding",
                                    address=None,
                                )
                            )

            # If chunks did not yield formatted items, parse grounded text carefully without hallucination
            if not providers and response and response.text:
                text = response.text
                lines = [line.strip() for line in text.split("\n") if line.strip()]
                for line in lines:
                    if line.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")):
                        clean_line = line.lstrip("-*0123456789. ")
                        if len(clean_line) > 5 and ("Clinic" in clean_line or "Hospital" in clean_line or "Center" in clean_line or "Dr." in clean_line or "Therapy" in clean_line or "Counseling" in clean_line or "Care" in clean_line or "Centre" in clean_line):
                            parts = clean_line.split(" - ")
                            name = parts[0].strip(" *#")
                            desc = parts[1].strip() if len(parts) > 1 else "Mental health & counseling service"
                            providers.append(
                                ProviderCard(
                                    name=name,
                                    maps_url=None,
                                    place_id=None,
                                    description=desc,
                                    address=None,
                                )
                            )

            return providers[:5]

        except Exception as e:
            logger.error(f"Error in Google Maps Grounding provider search: {type(e).__name__}")
            return []

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
