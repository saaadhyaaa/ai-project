import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.safety_service import SafetyService


class TestSafetyService(unittest.TestCase):

    def test_safe_messages(self):
        safe_inputs = [
            "I've been feeling really overwhelmed with college exams lately.",
            "Can you help me plan my morning routine?",
            "I felt happy today after taking a walk in the park.",
            "I'm feeling a little tired after a long workday.",
        ]
        for msg in safe_inputs:
            level, override = SafetyService.evaluate_message_safety(msg)
            self.assertEqual(level, "SAFE")
            self.assertFalse(override)

    def test_concerning_messages(self):
        concerning_inputs = [
            "I feel like I'm falling apart and have a panic attack.",
            "Everything feels completely hopeless and I can't take this anymore.",
            "I feel so alone and numb inside.",
        ]
        for msg in concerning_inputs:
            level, override = SafetyService.evaluate_message_safety(msg)
            self.assertEqual(level, "CONCERNING")
            self.assertFalse(override)

    def test_high_risk_messages(self):
        high_risk_inputs = [
            "I am having suicidal thoughts and want to die.",
            "I feel like killing myself tonight.",
            "I'm thinking about ending my life.",
            "I want to self-harm and cut my wrist.",
            "I don't want to live anymore, I am going to overdose.",
        ]
        for msg in high_risk_inputs:
            level, override = SafetyService.evaluate_message_safety(msg)
            self.assertEqual(level, "HIGH_RISK")
            self.assertTrue(override)

    def test_high_risk_response_content(self):
        msg, suggestions, followup = SafetyService.generate_high_risk_response()
        # Verify Tele-MANAS (India) and emergency numbers are present
        self.assertIn("14416", msg)
        self.assertIn("Tele-MANAS", msg)
        self.assertIn("112", msg)
        self.assertIn("Vandrevala", msg)
        self.assertTrue(len(suggestions) >= 3)
        self.assertIsNotNone(followup)

    def test_provider_search_detection(self):
        provider_queries = [
            "Can you find a therapist near me?",
            "Look for a psychologist in my area",
            "Are there any mental health clinics near me?",
            "I need a counselor near me for anxiety",
        ]
        for q in provider_queries:
            self.assertTrue(
                SafetyService.is_provider_search_request(q),
                f"Failed to detect provider search intent for: {q}",
            )

        non_provider_queries = [
            "I had a really busy day.",
            "How do I practice 4-7-8 breathing?",
            "What should I do about my exam stress?",
        ]
        for q in non_provider_queries:
            self.assertFalse(
                SafetyService.is_provider_search_request(q),
                f"Incorrectly flagged as provider search: {q}",
            )

    def test_crisis_resources_list(self):
        resources = SafetyService.get_crisis_resources()
        self.assertTrue(len(resources) >= 4)
        telemanas = next((r for r in resources if "Tele-MANAS" in r.name), None)
        self.assertIsNotNone(telemanas)
        self.assertEqual(telemanas.phone, "14416")


if __name__ == "__main__":
    unittest.main()
