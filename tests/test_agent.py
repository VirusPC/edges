import unittest

from claude_agent_sdk_test.agent import BASE_PROMPT, build_prompt


class BuildPromptTests(unittest.TestCase):
    def test_build_prompt_without_context(self) -> None:
        prompt = build_prompt("Create a starter task")

        self.assertIn(BASE_PROMPT, prompt)
        self.assertIn("Create a starter task", prompt)
        self.assertNotIn("Context:", prompt)

    def test_build_prompt_with_context(self) -> None:
        prompt = build_prompt("Inspect the repo", context="Python project")

        self.assertIn("Context:\nPython project", prompt)
        self.assertTrue(prompt.endswith("User request:\nInspect the repo"))


if __name__ == "__main__":
    unittest.main()
