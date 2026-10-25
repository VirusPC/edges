from __future__ import annotations

import unittest

from support import CASE_DIR  # noqa: F401

from constants import DEFAULT_BASE_URL, DEFAULT_MODEL
from openai_compat import resolve_api_config


class OpenAICompatTests(unittest.TestCase):
    def test_defaults_are_kimi_code_not_moonshot(self) -> None:
        self.assertEqual(DEFAULT_MODEL, "kimi-for-coding")
        self.assertEqual(DEFAULT_BASE_URL, "https://api.kimi.com/coding/v1")
        self.assertNotIn("moonshot", DEFAULT_BASE_URL)

    def test_resolve_prefers_kimi_key_and_default_base(self) -> None:
        import os

        stale = os.environ.pop("OPENAI_BASE_URL", None)
        try:
            key, url = resolve_api_config(api_key="sk-test", base_url=None)
            self.assertEqual(key, "sk-test")
            self.assertEqual(url, "https://api.kimi.com/coding/v1")
        finally:
            if stale is not None:
                os.environ["OPENAI_BASE_URL"] = stale
