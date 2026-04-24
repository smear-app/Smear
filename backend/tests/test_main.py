import os
import unittest
from unittest.mock import patch

from app.main import get_allowed_origins


class AllowedOriginsTests(unittest.TestCase):
    def test_defaults_include_current_production_origins(self):
        with patch.dict(os.environ, {}, clear=False):
            origins = get_allowed_origins()

        self.assertIn("https://smear.app", origins)
        self.assertIn("https://www.smear.app", origins)
        self.assertIn("https://smearapp.vercel.app", origins)

    def test_env_override_is_split_and_trimmed(self):
        with patch.dict(
            os.environ,
            {"CORS_ALLOW_ORIGINS": " https://smear.app, https://admin.smear.app ,http://localhost:5173 "},
            clear=False,
        ):
            origins = get_allowed_origins()

        self.assertEqual(
            origins,
            [
                "https://smear.app",
                "https://admin.smear.app",
                "http://localhost:5173",
            ],
        )


if __name__ == "__main__":
    unittest.main()
