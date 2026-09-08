from typing import List, Optional, Dict, Any, Tuple
from collections import Counter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models.checkin import CheckIn
from app.models.journal import JournalEntry
from app.models.conversation import Conversation
from app.models.message import Message


class ChatContextService:
    """
    Constructs a controlled, bounded, and user-isolated context pipeline
    from MindEase check-ins, journal entries, and conversation history.
    """

    @classmethod
    async def build_user_context(
        cls,
        user_id: str,
        conversation_id: Optional[str],
        db: AsyncSession,
        settings: Settings,
    ) -> Dict[str, Any]:
        """
        Gathers strictly bounded context for the authenticated user.
        Ensures cross-user isolation and token budget protection.
        """
        # 1. Fetch recent check-ins
        checkin_query = (
            select(CheckIn)
            .where(CheckIn.user_id == user_id)
            .order_by(CheckIn.created_at.desc())
            .limit(settings.CHAT_MAX_CHECKINS)
        )
        checkin_result = await db.execute(checkin_query)
        checkins: List[CheckIn] = list(checkin_result.scalars().all())

        # 2. Fetch recent journal entries
        journal_query = (
            select(JournalEntry)
            .where(JournalEntry.user_id == user_id)
            .order_by(JournalEntry.created_at.desc())
            .limit(settings.CHAT_MAX_JOURNAL_ENTRIES)
        )
        journal_result = await db.execute(journal_query)
        journals: List[JournalEntry] = list(journal_result.scalars().all())

        # 3. Fetch conversation & recent history
        conversation: Optional[Conversation] = None
        history_messages: List[Message] = []

        if conversation_id:
            conv_query = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            conv_result = await db.execute(conv_query)
            conversation = conv_result.scalar_one_or_none()

            if conversation:
                # Fetch recent messages up to limit
                msg_query = (
                    select(Message)
                    .where(Message.conversation_id == conversation.id)
                    .order_by(Message.created_at.desc())
                    .limit(settings.CHAT_MAX_HISTORY_MESSAGES)
                )
                msg_result = await db.execute(msg_query)
                # Reverse to maintain chronological order
                history_messages = list(reversed(msg_result.scalars().all()))

        # 4. Synthesize compact summaries
        checkin_summary = cls._summarize_checkins(checkins)
        journal_summary = cls._summarize_journals(journals, settings.CHAT_MAX_JOURNAL_CHARS)

        # 5. Format compact system context block
        context_parts = []

        if conversation and conversation.summary:
            context_parts.append(f"Conversation Context Summary:\n{conversation.summary.strip()}")

        if checkin_summary:
            context_parts.append(f"Recent Check-in Patterns:\n{checkin_summary}")

        if journal_summary:
            context_parts.append(f"Recent Journal Reflections:\n{journal_summary}")

        combined_context = "\n\n".join(context_parts)

        # Ensure bounded context length
        if len(combined_context) > settings.CHAT_MAX_CONTEXT_CHARS:
            combined_context = combined_context[: settings.CHAT_MAX_CONTEXT_CHARS] + "\n[Context truncated for brevity]"

        formatted_history = [
            {
                "role": "user" if m.role == "user" else "model",
                "parts": [{"text": m.content}],
            }
            for m in history_messages
        ]

        return {
            "conversation": conversation,
            "system_context": combined_context,
            "history_messages": history_messages,
            "formatted_history": formatted_history,
            "checkin_count": len(checkins),
            "journal_count": len(journals),
        }

    @staticmethod
    def _summarize_checkins(checkins: List[CheckIn]) -> Optional[str]:
        if not checkins:
            return None

        count = len(checkins)
        avg_mood = sum(c.mood_score for c in checkins) / count
        avg_stress = sum(c.stress_level for c in checkins) / count
        avg_energy = sum(c.energy_level for c in checkins) / count

        latest = checkins[0]
        latest_date = latest.created_at.strftime("%b %d") if latest.created_at else "Today"

        # Collect factors
        all_factors = []
        for c in checkins:
            if c.factors and isinstance(c.factors, list):
                all_factors.extend(c.factors)

        common_factors = [tag for tag, _ in Counter(all_factors).most_common(3)]
        factors_str = ", ".join(common_factors) if common_factors else "None noted"

        lines = [
            f"- Latest Log ({latest_date}): Mood '{latest.mood_label}' ({latest.mood_score}/5), Stress {latest.stress_level}/10, Energy {latest.energy_level}/10",
            f"- Recent Averages (last {count} check-ins): Mood {avg_mood:.1f}/5, Stress {avg_stress:.1f}/10, Energy {avg_energy:.1f}/10",
            f"- Recurring Life Factors: {factors_str}",
        ]
        if latest.note:
            note_preview = latest.note.strip().replace("\n", " ")[:120]
            lines.append(f"- Latest Note: \"{note_preview}\"")

        return "\n".join(lines)

    @staticmethod
    def _summarize_journals(journals: List[JournalEntry], max_chars: int) -> Optional[str]:
        if not journals:
            return None

        lines = []
        for j in journals[:3]:
            date_str = j.created_at.strftime("%b %d") if j.created_at else "Recent"
            tags_str = ", ".join(j.tags) if j.tags and isinstance(j.tags, list) else (j.sentiment or "Reflection")
            
            # Truncate content preview safely
            content_preview = j.content.strip().replace("\n", " ")
            if len(content_preview) > max_chars:
                content_preview = content_preview[:max_chars] + "..."

            title_str = f"'{j.title}'" if j.title else "Reflection"
            lines.append(f"- ({date_str}) {title_str} [Tags: {tags_str}]: \"{content_preview}\"")

        return "\n".join(lines)
