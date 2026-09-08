import logging
import calendar
import asyncio
import json
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional, Dict, Any, Tuple
from collections import Counter
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from google.genai import types
from google.genai.errors import APIError

from app.config import get_settings
from app.models.checkin import CheckIn
from app.models.journal import JournalEntry
from app.models.micro_goal import MicroGoal
from app.models.daily_summary import DailySummary
from app.models.weekly_summary import WeeklySummary
from app.models.user import User
from app.schemas.mood_board import (
    MonthMoodDay,
    MonthMoodResponse,
    DayCheckInDetail,
    DayJournalPreview,
    DayDetailResponse,
    WeeklyMetrics,
    WeeklyMicroGoalsMetric,
    WeeklySummaryAIResponse,
    WeeklyMoodResponse,
)
from app.schemas.micro_goal import MicroGoalResponse
from app.services.gemini_service import GeminiService

logger = logging.getLogger("mindease.mood_board")


class MoodBoardService:
    """
    Core service handling calendar aggregations, daily emotional detail synthesis,
    weekly trends analysis, deterministic fallback summaries, and cached Gemini reflections.
    """

    @classmethod
    async def get_month_mood_board(
        cls,
        user_id: str,
        year: int,
        month: int,
        db: AsyncSession,
    ) -> MonthMoodResponse:
        """
        Retrieves all mood, check-in, journal, and goal indicators for a given calendar month
        in a single optimized batch query.
        """
        _, num_days = calendar.monthrange(year, month)
        start_date_str = f"{year:04d}-{month:02d}-01"
        end_date_str = f"{year:04d}-{month:02d}-{num_days:02d}"

        # Use a safe +/- 1 day buffer to handle timezone offsets cleanly
        start_dt = datetime.strptime(start_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc) - timedelta(days=1)
        end_dt = datetime.strptime(end_date_str, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
        ) + timedelta(days=1)

        # 1. Fetch check-ins for the month
        checkin_query = select(CheckIn).where(
            and_(
                CheckIn.user_id == user_id,
                CheckIn.created_at >= start_dt,
                CheckIn.created_at <= end_dt,
            )
        ).order_by(CheckIn.created_at.asc())
        checkin_res = await db.execute(checkin_query)
        checkins = list(checkin_res.scalars().all())

        # 2. Fetch journal entries for the month
        journal_query = select(JournalEntry).where(
            and_(
                JournalEntry.user_id == user_id,
                JournalEntry.created_at >= start_dt,
                JournalEntry.created_at <= end_dt,
            )
        )
        journal_res = await db.execute(journal_query)
        journals = list(journal_res.scalars().all())

        # 3. Fetch micro goals for the month
        goals_query = select(MicroGoal).where(
            and_(
                MicroGoal.user_id == user_id,
                MicroGoal.goal_date >= start_date_str,
                MicroGoal.goal_date <= end_date_str,
            )
        )
        goals_res = await db.execute(goals_query)
        goals = list(goals_res.scalars().all())

        # Group data by date string (YYYY-MM-DD)
        checkin_map: Dict[str, CheckIn] = {}
        for c in checkins:
            c_date = c.created_at.strftime("%Y-%m-%d")
            # Keep latest checkin if multiple per day
            checkin_map[c_date] = c

        journal_map: Dict[str, List[JournalEntry]] = {}
        for j in journals:
            j_date = j.created_at.strftime("%Y-%m-%d")
            journal_map.setdefault(j_date, []).append(j)

        goals_map: Dict[str, List[MicroGoal]] = {}
        for g in goals:
            goals_map.setdefault(g.goal_date, []).append(g)

        # Construct MonthMoodDay objects for each day of the month
        days: List[MonthMoodDay] = []
        for day in range(1, num_days + 1):
            date_str = f"{year:04d}-{month:02d}-{day:02d}"
            ci = checkin_map.get(date_str)
            j_list = journal_map.get(date_str, [])
            g_list = goals_map.get(date_str, [])

            has_checkin = ci is not None
            has_journal = len(j_list) > 0
            journal_count = len(j_list)
            goal_count = len(g_list)
            completed_goal_count = sum(1 for g in g_list if g.completed)

            days.append(
                MonthMoodDay(
                    date=date_str,
                    mood_score=ci.mood_score if ci else None,
                    mood_label=ci.mood_label if ci else None,
                    mood_emoji=ci.mood_emoji if ci else None,
                    stress=ci.stress_level if ci else None,
                    energy=ci.energy_level if ci else None,
                    has_checkin=has_checkin,
                    has_journal=has_journal,
                    journal_count=journal_count,
                    goal_count=goal_count,
                    completed_goal_count=completed_goal_count,
                )
            )

        return MonthMoodResponse(year=year, month=month, days=days)

    @classmethod
    async def get_day_detail(
        cls,
        user_id: str,
        date_str: str,
        db: AsyncSession,
        gemini_service: Optional[GeminiService] = None,
        force_regenerate_summary: bool = False,
    ) -> DayDetailResponse:
        """
        Retrieves complete emotional detail, check-in information, journal previews,
        micro goals, and cached daily emotional summary for a single date.
        """
        # Use a safe +/- 1 day buffer around target date to handle local/server timezone offsets
        target_dt_start = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc) - timedelta(days=1)
        target_dt_end = datetime.strptime(date_str, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
        ) + timedelta(days=1)

        # 1. Fetch checkin
        ci_query = select(CheckIn).where(
            and_(
                CheckIn.user_id == user_id,
                CheckIn.created_at >= target_dt_start,
                CheckIn.created_at <= target_dt_end,
            )
        ).order_by(CheckIn.created_at.desc())
        ci_res = await db.execute(ci_query)
        all_cis = list(ci_res.scalars().all())
        # Match check-in whose date string corresponds to target date
        checkin_obj = next((c for c in all_cis if c.created_at.strftime("%Y-%m-%d") == date_str), None)
        if not checkin_obj and all_cis:
            # Fallback to latest checkin in range if user queried today
            checkin_obj = all_cis[0]

        # 2. Fetch journals
        j_query = select(JournalEntry).where(
            and_(
                JournalEntry.user_id == user_id,
                JournalEntry.created_at >= target_dt_start,
                JournalEntry.created_at <= target_dt_end,
            )
        ).order_by(JournalEntry.created_at.desc())
        j_res = await db.execute(j_query)
        all_js = list(j_res.scalars().all())
        journal_objs = [j for j in all_js if j.created_at.strftime("%Y-%m-%d") == date_str]

        # 3. Fetch micro goals
        goals_query = select(MicroGoal).where(
            and_(
                MicroGoal.user_id == user_id,
                MicroGoal.goal_date == date_str,
            )
        ).order_by(MicroGoal.created_at.asc())
        goals_res = await db.execute(goals_query)
        goal_objs = list(goals_res.scalars().all())

        # 4. Fetch or generate Daily Summary
        summary_text: Optional[str] = None
        sum_query = select(DailySummary).where(
            and_(
                DailySummary.user_id == user_id,
                DailySummary.summary_date == date_str,
            )
        )
        sum_res = await db.execute(sum_query)
        cached_summary = sum_res.scalar_one_or_none()

        if cached_summary and not force_regenerate_summary:
            summary_text = cached_summary.summary
        elif checkin_obj or journal_objs:
            # Generate new summary
            summary_text = await cls.generate_daily_summary(
                user_id=user_id,
                date_str=date_str,
                checkin=checkin_obj,
                journals=journal_objs,
                goals=goal_objs,
                db=db,
                gemini_service=gemini_service,
            )

        # Format responses
        checkin_detail = None
        if checkin_obj:
            checkin_detail = DayCheckInDetail(
                id=checkin_obj.id,
                mood_score=checkin_obj.mood_score,
                mood_label=checkin_obj.mood_label,
                mood_emoji=checkin_obj.mood_emoji,
                stress_level=checkin_obj.stress_level,
                energy_level=checkin_obj.energy_level,
                factors=checkin_obj.factors or [],
                note=checkin_obj.note,
                created_at=checkin_obj.created_at,
            )

        journal_previews: List[DayJournalPreview] = []
        for j in journal_objs:
            preview_text = j.content.strip().replace("\n", " ")
            if len(preview_text) > 160:
                preview_text = preview_text[:160] + "..."
            journal_previews.append(
                DayJournalPreview(
                    id=j.id,
                    title=j.title,
                    preview=preview_text,
                    sentiment=j.sentiment,
                    tags=j.tags or [],
                    created_at=j.created_at,
                )
            )

        micro_goal_responses = [
            MicroGoalResponse.model_validate(g) for g in goal_objs
        ]

        return DayDetailResponse(
            date=date_str,
            checkin=checkin_detail,
            journals=journal_previews,
            daily_summary=summary_text,
            micro_goals=micro_goal_responses,
        )

    @classmethod
    async def generate_daily_summary(
        cls,
        user_id: str,
        date_str: str,
        checkin: Optional[CheckIn],
        journals: List[JournalEntry],
        goals: List[MicroGoal],
        db: AsyncSession,
        gemini_service: Optional[GeminiService] = None,
    ) -> str:
        """
        Generates an empathetic, non-diagnostic daily emotional summary using Gemini if available,
        falling back seamlessly to a deterministic reflection. Caches the result in `daily_summaries`.
        """
        deterministic_summary = cls._generate_deterministic_daily_summary(checkin, journals, goals)
        summary_text = deterministic_summary

        if gemini_service and gemini_service.client and (checkin or journals):
            # Prompt Gemini with bounded single-day context
            prompt = cls._build_daily_gemini_prompt(date_str, checkin, journals, goals)
            try:
                config = types.GenerateContentConfig(
                    system_instruction=(
                        "You are MindEase AI Wellness Assistant. Write a supportive, compassionate 2-3 sentence "
                        "emotional reflection for the user's logged day. "
                        "NEVER diagnose, label with clinical terms (e.g. 'depression', 'anxiety disorder'), "
                        "or make medical assertions. Use gentle language like 'It looks like...', 'You mentioned...', "
                        "'Your day felt...'. Be concise and grounded."
                    ),
                    max_output_tokens=180,
                    temperature=0.4,
                )
                settings = get_settings()
                response = await asyncio.to_thread(
                    gemini_service.client.models.generate_content,
                    model=settings.GEMINI_MODEL or "gemini-3.1-flash-lite",
                    contents=prompt,
                    config=config,
                )
                if response and response.text and len(response.text.strip()) > 15:
                    summary_text = response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini daily summary error: {type(e).__name__}. Using deterministic summary.")
                summary_text = deterministic_summary

        # Cache or update daily_summaries record
        sum_query = select(DailySummary).where(
            and_(
                DailySummary.user_id == user_id,
                DailySummary.summary_date == date_str,
            )
        )
        sum_res = await db.execute(sum_query)
        existing_sum = sum_res.scalar_one_or_none()

        if existing_sum:
            existing_sum.summary = summary_text
        else:
            new_sum = DailySummary(
                user_id=user_id,
                summary_date=date_str,
                summary=summary_text,
            )
            db.add(new_sum)

        await db.commit()
        return summary_text

    @staticmethod
    def _generate_deterministic_daily_summary(
        checkin: Optional[CheckIn],
        journals: List[JournalEntry],
        goals: List[MicroGoal],
    ) -> str:
        """
        Creates a high-quality, natural deterministic summary based on actual input fields.
        """
        if not checkin and not journals:
            return "No check-in or journal entries were recorded for this date."

        parts = []
        if checkin:
            mood_val = checkin.mood_score
            mood_label = checkin.mood_label
            stress = checkin.stress_level
            energy = checkin.energy_level
            factors = checkin.factors if isinstance(checkin.factors, list) else []

            # Mood & energy tone
            if mood_val >= 4:
                mood_desc = "You seemed fairly positive and in good spirits today"
            elif mood_val == 3:
                mood_desc = "Today felt relatively balanced and steady"
            else:
                mood_desc = "Today felt a bit more demanding and heavy"

            # Stress context
            if stress >= 7:
                stress_desc = f"with noticeable stress ({stress}/10)"
            elif stress <= 3:
                stress_desc = "with a calm, relaxed pace"
            else:
                stress_desc = "with manageable everyday stress"

            # Factors context
            if factors:
                factor_text = f", and {', '.join(factors[:2])} appeared to play a key role"
            else:
                factor_text = ""

            parts.append(f"{mood_desc} {stress_desc}{factor_text}.")

            if checkin.note and len(checkin.note.strip()) > 0:
                parts.append(f"You noted: \"{checkin.note.strip()[:100]}\".")

        if journals:
            latest_j = journals[0]
            if latest_j.title:
                parts.append(f"Your journal reflection on '{latest_j.title}' showed thoughtful mindfulness.")
            else:
                parts.append("Your journal reflection captured a meaningful moment of personal pause.")

        if goals:
            completed_count = sum(1 for g in goals if g.completed)
            if completed_count > 0:
                parts.append(f"You completed {completed_count} small wellness action{'s' if completed_count > 1 else ''} today.")

        return " ".join(parts)

    @staticmethod
    def _build_daily_gemini_prompt(
        date_str: str,
        checkin: Optional[CheckIn],
        journals: List[JournalEntry],
        goals: List[MicroGoal],
    ) -> str:
        lines = [f"Date: {date_str}"]
        if checkin:
            factors_str = ", ".join(checkin.factors) if checkin.factors and isinstance(checkin.factors, list) else "None noted"
            lines.append(
                f"- Mood: {checkin.mood_label} ({checkin.mood_score}/5), Stress: {checkin.stress_level}/10, Energy: {checkin.energy_level}/10"
            )
            lines.append(f"- Factors: {factors_str}")
            if checkin.note:
                lines.append(f"- Note: \"{checkin.note.strip()[:140]}\"")

        if journals:
            for j in journals[:2]:
                j_title = f"'{j.title}'" if j.title else "Reflection"
                preview = j.content.strip().replace("\n", " ")[:140]
                lines.append(f"- Journal ({j_title}): \"{preview}\"")

        if goals:
            completed = sum(1 for g in goals if g.completed)
            lines.append(f"- Micro Goals: {completed}/{len(goals)} completed")

        lines.append("\nGenerate a warm, concise 2-3 sentence supportive reflection based strictly on these actual entries.")
        return "\n".join(lines)

    @classmethod
    async def get_week_mood_board(
        cls,
        user_id: str,
        start_date_str: str,
        db: AsyncSession,
        gemini_service: Optional[GeminiService] = None,
        force_regenerate_summary: bool = False,
    ) -> WeeklyMoodResponse:
        """
        Retrieves weekly metrics, common emotion tags, contributing factors,
        7-day daily breakdown, micro goal completion statistics, and cached weekly summary.
        """
        start_dt_obj = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_dt_obj = start_dt_obj + timedelta(days=6)
        end_date_str = end_dt_obj.strftime("%Y-%m-%d")

        start_dt = datetime.combine(start_dt_obj, datetime.min.time()).replace(tzinfo=timezone.utc) - timedelta(days=1)
        end_dt = datetime.combine(end_dt_obj, datetime.max.time()).replace(tzinfo=timezone.utc) + timedelta(days=1)

        # 1. Fetch checkins in week
        checkin_query = select(CheckIn).where(
            and_(
                CheckIn.user_id == user_id,
                CheckIn.created_at >= start_dt,
                CheckIn.created_at <= end_dt,
            )
        ).order_by(CheckIn.created_at.asc())
        checkin_res = await db.execute(checkin_query)
        raw_checkins = list(checkin_res.scalars().all())
        checkins = [c for c in raw_checkins if start_date_str <= c.created_at.strftime("%Y-%m-%d") <= end_date_str]

        # 2. Fetch journals in week
        journal_query = select(JournalEntry).where(
            and_(
                JournalEntry.user_id == user_id,
                JournalEntry.created_at >= start_dt,
                JournalEntry.created_at <= end_dt,
            )
        ).order_by(JournalEntry.created_at.asc())
        journal_res = await db.execute(journal_query)
        raw_journals = list(journal_res.scalars().all())
        journals = [j for j in raw_journals if start_date_str <= j.created_at.strftime("%Y-%m-%d") <= end_date_str]

        # 3. Fetch goals in week
        goals_query = select(MicroGoal).where(
            and_(
                MicroGoal.user_id == user_id,
                MicroGoal.goal_date >= start_date_str,
                MicroGoal.goal_date <= end_date_str,
            )
        ).order_by(MicroGoal.created_at.asc())
        goals_res = await db.execute(goals_query)
        goals = list(goals_res.scalars().all())

        # Build maps
        checkin_map: Dict[str, CheckIn] = {}
        for c in checkins:
            c_date = c.created_at.strftime("%Y-%m-%d")
            checkin_map[c_date] = c

        journal_map: Dict[str, List[JournalEntry]] = {}
        for j in journals:
            j_date = j.created_at.strftime("%Y-%m-%d")
            journal_map.setdefault(j_date, []).append(j)

        goals_map: Dict[str, List[MicroGoal]] = {}
        for g in goals:
            goals_map.setdefault(g.goal_date, []).append(g)

        # Build 7-day daily breakdown
        daily_breakdown: List[MonthMoodDay] = []
        for i in range(7):
            current_day = start_dt_obj + timedelta(days=i)
            d_str = current_day.strftime("%Y-%m-%d")
            ci = checkin_map.get(d_str)
            j_list = journal_map.get(d_str, [])
            g_list = goals_map.get(d_str, [])

            daily_breakdown.append(
                MonthMoodDay(
                    date=d_str,
                    mood_score=ci.mood_score if ci else None,
                    mood_label=ci.mood_label if ci else None,
                    mood_emoji=ci.mood_emoji if ci else None,
                    stress=ci.stress_level if ci else None,
                    energy=ci.energy_level if ci else None,
                    has_checkin=ci is not None,
                    has_journal=len(j_list) > 0,
                    journal_count=len(j_list),
                    goal_count=len(g_list),
                    completed_goal_count=sum(1 for g in g_list if g.completed),
                )
            )

        # Compute numerical metrics
        ci_count = len(checkins)
        avg_mood = round(sum(c.mood_score for c in checkins) / ci_count, 1) if ci_count > 0 else None
        avg_stress = round(sum(c.stress_level for c in checkins) / ci_count, 1) if ci_count > 0 else None
        avg_energy = round(sum(c.energy_level for c in checkins) / ci_count, 1) if ci_count > 0 else None

        metrics = WeeklyMetrics(
            average_mood=avg_mood,
            average_stress=avg_stress,
            average_energy=avg_energy,
            checkin_count=ci_count,
            journal_count=len(journals),
        )

        # Extract common factors
        all_factors = []
        for c in checkins:
            if c.factors and isinstance(c.factors, list):
                all_factors.extend(c.factors)
        common_factors = [f for f, _ in Counter(all_factors).most_common(4)]

        # Extract common emotion tags from journals and check-ins
        all_emotions = []
        for j in journals:
            if j.tags and isinstance(j.tags, list):
                all_emotions.extend(j.tags)
            elif j.sentiment:
                all_emotions.append(j.sentiment)
        for c in checkins:
            all_emotions.append(c.mood_label)
        common_emotions = [e for e, _ in Counter(all_emotions).most_common(4)]

        # Micro goals calculation
        total_goals = len(goals)
        completed_goals = sum(1 for g in goals if g.completed)
        completion_rate = round((completed_goals / total_goals * 100.0), 1) if total_goals > 0 else 0.0
        micro_goals_metric = WeeklyMicroGoalsMetric(
            completed=completed_goals,
            total=total_goals,
            completion_rate=completion_rate,
        )

        # Fetch or generate Weekly Summary
        sum_query = select(WeeklySummary).where(
            and_(
                WeeklySummary.user_id == user_id,
                WeeklySummary.week_start_date == start_date_str,
            )
        )
        sum_res = await db.execute(sum_query)
        cached_summary = sum_res.scalar_one_or_none()

        summary_text: Optional[str] = None
        highlights: List[str] = []
        patterns: List[str] = []
        gentle_focus: Optional[str] = None

        if cached_summary and not force_regenerate_summary:
            summary_text = cached_summary.summary
            highlights = cached_summary.highlights or []
            patterns = cached_summary.patterns or []
            gentle_focus = cached_summary.gentle_focus
        else:
            # Generate new weekly summary
            (
                summary_text,
                highlights,
                patterns,
                gentle_focus,
            ) = await cls.generate_weekly_summary(
                user_id=user_id,
                start_date_str=start_date_str,
                end_date_str=end_date_str,
                checkins=checkins,
                journals=journals,
                goals=goals,
                metrics=metrics,
                common_factors=common_factors,
                common_emotions=common_emotions,
                db=db,
                gemini_service=gemini_service,
            )

        return WeeklyMoodResponse(
            start_date=start_date_str,
            end_date=end_date_str,
            metrics=metrics,
            common_emotions=common_emotions,
            common_factors=common_factors,
            daily_breakdown=daily_breakdown,
            summary=summary_text,
            highlights=highlights,
            patterns=patterns,
            gentle_focus=gentle_focus,
            micro_goals=micro_goals_metric,
        )

    @classmethod
    async def generate_weekly_summary(
        cls,
        user_id: str,
        start_date_str: str,
        end_date_str: str,
        checkins: List[CheckIn],
        journals: List[JournalEntry],
        goals: List[MicroGoal],
        metrics: WeeklyMetrics,
        common_factors: List[str],
        common_emotions: List[str],
        db: AsyncSession,
        gemini_service: Optional[GeminiService] = None,
    ) -> Tuple[str, List[str], List[str], Optional[str]]:
        """
        Generates structured weekly emotional reflection using Gemini with fallback.
        Caches the result into `weekly_summaries`.
        """
        if not checkins and not journals:
            empty_summary = "Your week is still unfolding. Nothing logged yet — your first check-in will start building your weekly picture."
            return empty_summary, [], [], "Take a quiet moment today to check in with yourself."

        # Deterministic generation as base
        det_summary, det_highlights, det_patterns, det_focus = cls._generate_deterministic_weekly_summary(
            checkins=checkins,
            journals=journals,
            goals=goals,
            metrics=metrics,
            common_factors=common_factors,
            common_emotions=common_emotions,
        )

        final_summary = det_summary
        final_highlights = det_highlights
        final_patterns = det_patterns
        final_focus = det_focus

        if gemini_service and gemini_service.client and checkins:
            prompt = cls._build_weekly_gemini_prompt(
                start_date_str=start_date_str,
                end_date_str=end_date_str,
                checkins=checkins,
                journals=journals,
                goals=goals,
                metrics=metrics,
                common_factors=common_factors,
                common_emotions=common_emotions,
            )
            try:
                config = types.GenerateContentConfig(
                    system_instruction=(
                        "You are MindEase AI Wellness Assistant. Synthesize a compassionate, supportive weekly emotional summary. "
                        "Return valid JSON matching the schema with 'summary', 'highlights', 'patterns', and 'gentle_focus'. "
                        "NEVER diagnose mental illness or use clinical pathology labels. Be gentle, encouraging, and grounded."
                    ),
                    response_mime_type="application/json",
                    response_schema=WeeklySummaryAIResponse,
                    max_output_tokens=300,
                    temperature=0.4,
                )
                settings = get_settings()
                response = await asyncio.to_thread(
                    gemini_service.client.models.generate_content,
                    model=settings.GEMINI_MODEL or "gemini-3.1-flash-lite",
                    contents=prompt,
                    config=config,
                )
                if response and response.text:
                    parsed = json.loads(response.text)
                    ai_obj = WeeklySummaryAIResponse(**parsed)
                    final_summary = ai_obj.summary
                    final_highlights = ai_obj.highlights
                    final_patterns = ai_obj.patterns
                    final_focus = ai_obj.gentle_focus
            except Exception as e:
                logger.warning(f"Gemini weekly summary error: {type(e).__name__}. Falling back to deterministic.")

        # Cache in weekly_summaries
        sum_query = select(WeeklySummary).where(
            and_(
                WeeklySummary.user_id == user_id,
                WeeklySummary.week_start_date == start_date_str,
            )
        )
        sum_res = await db.execute(sum_query)
        existing_sum = sum_res.scalar_one_or_none()

        if existing_sum:
            existing_sum.summary = final_summary
            existing_sum.highlights = final_highlights
            existing_sum.patterns = final_patterns
            existing_sum.gentle_focus = final_focus
            existing_sum.avg_mood = metrics.average_mood
            existing_sum.avg_stress = metrics.average_stress
            existing_sum.avg_energy = metrics.average_energy
        else:
            new_sum = WeeklySummary(
                user_id=user_id,
                week_start_date=start_date_str,
                summary=final_summary,
                highlights=final_highlights,
                patterns=final_patterns,
                gentle_focus=final_focus,
                avg_mood=metrics.average_mood,
                avg_stress=metrics.average_stress,
                avg_energy=metrics.average_energy,
            )
            db.add(new_sum)

        await db.commit()
        return final_summary, final_highlights, final_patterns, final_focus

    @staticmethod
    def _generate_deterministic_weekly_summary(
        checkins: List[CheckIn],
        journals: List[JournalEntry],
        goals: List[MicroGoal],
        metrics: WeeklyMetrics,
        common_factors: List[str],
        common_emotions: List[str],
    ) -> Tuple[str, List[str], List[str], Optional[str]]:
        if not checkins:
            return (
                "Your reflections for this week show meaningful self-awareness.",
                ["You took time to write and reflect."],
                ["Reflective writing supported your emotional clarity."],
                "Continue making time for brief daily check-ins.",
            )

        avg_m = metrics.average_mood or 3.0
        avg_s = metrics.average_stress or 5.0
        factors_text = f"around {', '.join(common_factors[:2])}" if common_factors else "across your daily routine"

        if avg_m >= 3.8:
            summary = f"This week was generally steady and positive. You maintained solid emotional resilience while managing stress {factors_text}."
            highlights = ["Your overall mood remained buoyant across multiple days."]
        elif avg_m >= 2.8:
            summary = f"This week was balanced with moderate fluctuations. Stress averaged {avg_s}/10 {factors_text}, but you found moments of stability."
            highlights = ["You noticed steady periods of calm throughout the week."]
        else:
            summary = f"This week felt more demanding. Lower mood and higher tension appeared {factors_text}, making gentle self-compassion especially valuable."
            highlights = ["You continued checking in and honoring your feelings during tough days."]

        patterns = []
        if common_factors:
            patterns.append(f"{common_factors[0]} was your most frequently noted life factor.")
        if common_emotions:
            patterns.append(f"'{common_emotions[0]}' appeared most often across your entries.")

        if goals:
            completed = sum(1 for g in goals if g.completed)
            highlights.append(f"You completed {completed} of {len(goals)} small wellness goals.")

        focus = "Protect a few quiet minutes for yourself each day."
        return summary, highlights, patterns, focus

    @staticmethod
    def _build_weekly_gemini_prompt(
        start_date_str: str,
        end_date_str: str,
        checkins: List[CheckIn],
        journals: List[JournalEntry],
        goals: List[MicroGoal],
        metrics: WeeklyMetrics,
        common_factors: List[str],
        common_emotions: List[str],
    ) -> str:
        lines = [
            f"Week: {start_date_str} to {end_date_str}",
            f"Averages: Mood={metrics.average_mood}/5, Stress={metrics.average_stress}/10, Energy={metrics.average_energy}/10",
            f"Check-ins count: {metrics.checkin_count}, Journals count: {metrics.journal_count}",
            f"Common factors: {', '.join(common_factors) if common_factors else 'None'}",
            f"Common emotions: {', '.join(common_emotions) if common_emotions else 'None'}",
        ]

        if goals:
            completed = sum(1 for g in goals if g.completed)
            lines.append(f"Micro goals: {completed}/{len(goals)} completed")

        lines.append("\nDaily logs summary:")
        for c in checkins:
            day_name = c.created_at.strftime("%A") if c.created_at else "Day"
            factors_s = ", ".join(c.factors) if c.factors and isinstance(c.factors, list) else "None"
            lines.append(f"- {day_name}: Mood '{c.mood_label}' ({c.mood_score}/5), Stress {c.stress_level}/10, Factors: {factors_s}")

        if journals:
            lines.append("\nJournal themes:")
            for j in journals[:3]:
                preview = j.content.strip().replace("\n", " ")[:100]
                lines.append(f"- \"{preview}\"")

        return "\n".join(lines)
