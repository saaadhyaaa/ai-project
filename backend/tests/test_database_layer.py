import unittest
import sys
import os
from datetime import datetime
from pydantic import ValidationError

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Base, User, CheckIn, JournalEntry
from app.schemas.checkin import CreateCheckIn, CheckInResponse
from app.schemas.journal import CreateJournalEntry, JournalEntryResponse


class TestDatabaseLayer(unittest.TestCase):

    def test_schema_valid_checkin(self):
        data = {
            "mood_score": 4,
            "mood_label": "Good",
            "mood_emoji": "🙂",
            "stress_level": 3,
            "energy_level": 8,
            "factors": ["Sleep", "Exercise"],
            "note": "Great morning session.",
        }
        schema = CreateCheckIn(**data)
        self.assertEqual(schema.mood_score, 4)
        self.assertEqual(schema.stress_level, 3)
        self.assertEqual(schema.factors, ["Sleep", "Exercise"])

    def test_schema_invalid_checkin_ranges(self):
        # mood_score > 5
        with self.assertRaises(ValidationError):
            CreateCheckIn(
                mood_score=6,
                mood_label="Invalid",
                stress_level=5,
                energy_level=5,
            )

        # mood_score < 1
        with self.assertRaises(ValidationError):
            CreateCheckIn(
                mood_score=0,
                mood_label="Invalid",
                stress_level=5,
                energy_level=5,
            )

        # stress_level > 10
        with self.assertRaises(ValidationError):
            CreateCheckIn(
                mood_score=3,
                mood_label="Okay",
                stress_level=11,
                energy_level=5,
            )

    def test_schema_valid_journal(self):
        data = {
            "title": "Evening Reflections",
            "content": "Noticing how calm I feel after stepping away from the screen.",
            "tags": ["Calm", "Grateful"],
            "sentiment": "Calm",
        }
        schema = CreateJournalEntry(**data)
        self.assertEqual(schema.title, "Evening Reflections")
        self.assertEqual(len(schema.tags), 2)

    def test_schema_empty_journal_content_rejected(self):
        with self.assertRaises(ValidationError):
            CreateJournalEntry(title="Empty Entry", content="")

    def test_model_tables_metadata(self):
        tables = Base.metadata.tables
        self.assertIn("users", tables)
        self.assertIn("checkins", tables)
        self.assertIn("journal_entries", tables)

        # Verify CheckIn table structure
        checkin_cols = tables["checkins"].columns
        self.assertIn("id", checkin_cols)
        self.assertIn("user_id", checkin_cols)
        self.assertIn("mood_score", checkin_cols)
        self.assertIn("stress_level", checkin_cols)
        self.assertIn("energy_level", checkin_cols)
        self.assertIn("factors", checkin_cols)
        self.assertIn("note", checkin_cols)
        self.assertIn("created_at", checkin_cols)

        # Verify JournalEntry table structure
        journal_cols = tables["journal_entries"].columns
        self.assertIn("id", journal_cols)
        self.assertIn("user_id", journal_cols)
        self.assertIn("title", journal_cols)
        self.assertIn("content", journal_cols)
        self.assertIn("tags", journal_cols)
        self.assertIn("sentiment", journal_cols)
        self.assertIn("created_at", journal_cols)
        self.assertIn("updated_at", journal_cols)


if __name__ == "__main__":
    unittest.main()
