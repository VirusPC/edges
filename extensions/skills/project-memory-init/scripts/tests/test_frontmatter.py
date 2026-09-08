#!/usr/bin/env python3
"""Drive shipped parse/render/remember/doctor paths for Agent Skills frontmatter."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from nodes.entries import (  # noqa: E402
    FLAT_COMPAT_KEYS,
    build_entry_fields,
    extract_entry_body,
    has_legacy_flat_frontmatter,
    parse_frontmatter,
    render_entry,
    rewrite_ordinary_header,
    top_level_frontmatter_keys,
)
from operations.doctor import doctor_memory  # noqa: E402
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402

MEMORY_PY = SCRIPTS / "memory.py"
FLAT_KEYS = tuple(sorted(FLAT_COMPAT_KEYS))


def top_level_keys_from_text(text: str) -> set[str]:
    keys: set[str] = set()
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return keys
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if not line.strip() or line.startswith((" ", "\t")):
            continue
        key, separator, _value = line.partition(":")
        if separator:
            keys.add(key.strip())
    return keys


def assert_closed_set_header(test: unittest.TestCase, text: str) -> None:
    keys = top_level_keys_from_text(text)
    leaked = keys & set(FLAT_KEYS)
    test.assertFalse(leaked, f"implementation keys at top level: {sorted(leaked)}")
    test.assertIn("name", keys)
    test.assertIn("description", keys)
    test.assertIn("metadata", keys)


class ParseRenderTests(unittest.TestCase):
    def test_render_new_ordinary_entry_uses_metadata(self) -> None:
        fields = build_entry_fields(
            name="project_sample",
            entry_type="project",
            title="A title",
            description="A description for the index line.",
            existing={},
            detected={
                "originSessionId": "sess-1",
                "agentClient": "cursor",
                "username": "viruspc",
                "email": "a@example.com",
            },
            overrides={},
        )
        rendered = render_entry(fields, "Body stays here.\n\n**Why:** because.")
        assert_closed_set_header(self, rendered)
        self.assertIn("edges-title: A title", rendered)
        self.assertIn("edges-type: project", rendered)
        self.assertIn("edges-origin-session-id: sess-1", rendered)
        self.assertIn("edges-updated-at:", rendered)
        self.assertIn("Body stays here.", rendered)
        for key in FLAT_KEYS:
            self.assertNotRegex(rendered, rf"(?m)^{key}:", msg=key)

    def test_parse_old_flat_top_level(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            path = Path(raw) / "project_old.md"
            path.write_text(
                "\n".join(
                    [
                        "---",
                        "name: project_old",
                        "title: Old Title",
                        "description: old description",
                        "type: project",
                        "originSessionId: origin-1",
                        "agentClient: claude-code",
                        "username: viruspc",
                        "email: a@example.com",
                        'updatedAt: "2026-01-01T00:00:00+08:00"',
                        "---",
                        "",
                        "Old body.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            fields = parse_frontmatter(path)
            self.assertEqual(fields["title"], "Old Title")
            self.assertEqual(fields["type"], "project")
            self.assertEqual(fields["originSessionId"], "origin-1")
            self.assertEqual(fields["agentClient"], "claude-code")
            self.assertEqual(fields["username"], "viruspc")
            self.assertEqual(fields["email"], "a@example.com")
            self.assertEqual(fields["updatedAt"], "2026-01-01T00:00:00+08:00")
            self.assertEqual(fields["description"], "old description")
            self.assertTrue(has_legacy_flat_frontmatter(path))

    def test_parse_nested_metadata_same_logical_fields(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            path = Path(raw) / "project_new.md"
            path.write_text(
                "\n".join(
                    [
                        "---",
                        "name: project_new",
                        "description: new description",
                        "metadata:",
                        "  edges-title: New Title",
                        "  edges-type: project",
                        "  edges-origin-session-id: origin-2",
                        "  edges-agent-client: cursor",
                        "  edges-username: viruspc",
                        "  edges-email: a@example.com",
                        '  edges-updated-at: "2026-02-02T00:00:00+08:00"',
                        "---",
                        "",
                        "New body.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            fields = parse_frontmatter(path)
            self.assertEqual(fields["title"], "New Title")
            self.assertEqual(fields["type"], "project")
            self.assertEqual(fields["originSessionId"], "origin-2")
            self.assertEqual(fields["updatedAt"], "2026-02-02T00:00:00+08:00")
            self.assertFalse(has_legacy_flat_frontmatter(path))
            self.assertEqual(
                top_level_frontmatter_keys(path) & set(FLAT_KEYS),
                set(),
            )

    def test_metadata_wins_over_top_level_when_both_present(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            path = Path(raw) / "project_mixed.md"
            path.write_text(
                "\n".join(
                    [
                        "---",
                        "name: project_mixed",
                        "title: Top Title",
                        "description: mixed",
                        "type: project",
                        "metadata:",
                        "  edges-title: Nested Title",
                        "  edges-type: project",
                        "---",
                        "",
                        "Mixed body.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            fields = parse_frontmatter(path)
            self.assertEqual(fields["title"], "Nested Title")

    def test_remember_update_keeps_title_from_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            remember(
                target,
                "project",
                "keep_title",
                "Keep This Title",
                "index line for keep title",
                "First body.",
                {"username": "viruspc", "email": "a@example.com"},
            )
            path = target / ".memory" / "projects" / "project_keep_title.md"
            self.assertTrue(path.is_file())
            assert_closed_set_header(self, path.read_text(encoding="utf-8"))
            remember(
                target,
                "project",
                "keep_title",
                None,
                None,
                "Second body, title omitted.",
                {"username": "viruspc", "email": "a@example.com"},
            )
            fields = parse_frontmatter(path)
            self.assertEqual(fields["title"], "Keep This Title")
            self.assertIn("Second body, title omitted.", path.read_text(encoding="utf-8"))

    def test_doctor_apply_rewrites_only_header(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            path = target / ".memory" / "projects" / "project_legacy.md"
            body = "Legacy body must survive.\n\n**Why:** doctor only touches the header."
            path.write_text(
                "\n".join(
                    [
                        "---",
                        "name: project_legacy",
                        "title: Legacy Title",
                        "description: leftover flat header",
                        "type: project",
                        "username: viruspc",
                        "email: a@example.com",
                        'updatedAt: "2026-03-03T00:00:00+08:00"',
                        "---",
                        "",
                        body,
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            before_body = extract_entry_body(path.read_text(encoding="utf-8")).strip()
            diagnosed = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in diagnosed["findings"]}
            self.assertIn("legacy-flat-frontmatter", issues)
            applied = doctor_memory(target, apply=True)
            remaining_issues = {item["issue"] for item in applied["remaining"]}
            self.assertNotIn("legacy-flat-frontmatter", remaining_issues)
            rewritten = path.read_text(encoding="utf-8")
            assert_closed_set_header(self, rewritten)
            self.assertEqual(extract_entry_body(rewritten).strip(), before_body)
            self.assertEqual(parse_frontmatter(path)["title"], "Legacy Title")
            self.assertEqual(
                parse_frontmatter(path)["updatedAt"], "2026-03-03T00:00:00+08:00"
            )
            self.assertFalse(has_legacy_flat_frontmatter(path))
            self.assertFalse(rewrite_ordinary_header(path))


class CliRememberTests(unittest.TestCase):
    def test_cli_init_remember_update(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_result = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "init",
                    "--target-dir",
                    str(target),
                    "--root-dir",
                    str(target),
                    "--description",
                    "cli temp",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(init_result.returncode, 0, init_result.stderr)
            init_payload = json.loads(init_result.stdout)
            self.assertTrue(init_payload.get("ok"))
            remember_result = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "remember",
                    "--target-dir",
                    str(target),
                    "--type",
                    "project",
                    "--slug",
                    "cli_sample",
                    "--title",
                    "CLI Title",
                    "--description",
                    "created from the shipped CLI",
                    "--username",
                    "viruspc",
                    "--email",
                    "a@example.com",
                    "--content",
                    "CLI body.\n\n**Why:** exercise remember.\n\n**How to apply:** read it.",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(remember_result.returncode, 0, remember_result.stderr)
            remember_payload = json.loads(remember_result.stdout)
            self.assertTrue(remember_payload.get("ok"))
            path = target / ".memory" / "projects" / "project_cli_sample.md"
            text = path.read_text(encoding="utf-8")
            assert_closed_set_header(self, text)
            update = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "remember",
                    "--target-dir",
                    str(target),
                    "--type",
                    "project",
                    "--slug",
                    "cli_sample",
                    "--username",
                    "viruspc",
                    "--email",
                    "a@example.com",
                    "--content",
                    "Updated CLI body, title omitted.",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(update.returncode, 0, update.stderr)
            update_payload = json.loads(update.stdout)
            self.assertTrue(update_payload.get("ok"))
            fields = parse_frontmatter(path)
            self.assertEqual(fields["title"], "CLI Title")
            self.assertIn("Updated CLI body, title omitted.", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
