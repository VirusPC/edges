# Type Index as Directory AGENTS.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every Memory Type index from a flat `.memory/TYPE.md` file to `.memory/<plural>/AGENTS.md`, colocated with that type’s entries, while keeping layer-root `AGENTS.md` as a different contract.

**Architecture:** `index_files()` still derives the official seed map from `AGENTS.tmpl.md`, but each seed link is now `.memory/<plural>/AGENTS.md`. Layer discovery follows those links (and leftover `*/AGENTS.md` type indexes). Type bodies still render from `FEEDBACK.tmpl.md` / `USER.tmpl.md` / `TYPE.tmpl.md` — never from the layer `AGENTS.tmpl.md`. Doctor recognizes leftover flat `.memory/FEEDBACK.md` (and the other five seed names plus user ALL-CAPS files), copies them to `<plural>/AGENTS.md`, then deletes the old file. `agent_skills` index lives under `.memory/agent_skills/`; tools still never write `.agents/`.

**Tech Stack:** Python 3 stdlib (`unittest`, `argparse`, `pathlib`, `re`), existing `scripts/memory.py` CLI, Agent Skills frontmatter + Keep a Changelog. No new libraries. No `edges` CLI work.

**Spec:** `docs/adr/0012-type-memory-index-as-directory-agents.md` (accepted; docs landed via PR #83). Protocol/layout: `extensions/skills/project-memory-init/references/PROTOCOL.md`, `LAYOUT.md`. Glossary: `CONTEXT.md` terms **层入口 AGENTS.md** vs **类型入口 AGENTS.md**. Prior extension surface: ADR 0006. User gitignore: ADR 0003.

## Global Constraints

- Co-authored-by on every commit: `Coding 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Skill change order: `PROTOCOL.md` (already updated) → `LAYOUT.md` (already describes target; drop “本轮不实现”) → `project-memory-init` → other non-doctor skills → `project-memory-doctor`
- Official init seeds stay exactly: `user` / `feedback` / `project` / `reference` / `skills` / `agent_skills`
- Type templates keep their current body shape; only output path/filename changes
- `user` → `users/AGENTS.md` (covered by existing `users/` gitignore). Keep legacy `.memory/USER.md` ignore until leftover files are gone
- `agent_skills` index at `.memory/agent_skills/AGENTS.md`; never write under `.agents/`
- Do **not** reopen a type registry or a pluggable Memory backend
- Do **not** change `knowledge/tasks` board status or task bodies
- Do **not** auto-create/edit/move/delete `knowledge/posts/`
- Do **not** commit `.memory/USER.md` or `.memory/users/**` content
- Public repo: no credentials, tokens, or personal data
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`

---

## File map

**Create**

- `extensions/skills/project-memory-init/scripts/tests/test_type_index_as_directory_agents.py` — new-path init / discovery / remember / doctor migration / no `.agents/` writes

**Modify (scripts)**

- `extensions/skills/project-memory-init/scripts/lib/paths.py` — `type_index_path()`, `type_index_relpath()`, `type_from_dir_name()`
- `extensions/skills/project-memory-init/scripts/lib/blocks.py` — `MEMORY_INDEX_LINK_PATTERN` matches `.memory/<plural>/AGENTS.md`; keep a legacy flat-link regex; `index_files()` returns `{user: users/AGENTS.md, ...}`
- `extensions/skills/project-memory-init/scripts/lib/types.py` — `index_file_name()` → `<plural>/AGENTS.md`; `type_index_template_name()` stays `TYPE.md`; discovery follows new links + `*/AGENTS.md`; `upsert_local_type_line` writes `.memory/<plural>/AGENTS.md`
- `extensions/skills/project-memory-init/scripts/lib/templates.py` — `read_index_template` still keys off `FEEDBACK.md` / `TYPE.md`, never `AGENTS.md`
- `extensions/skills/project-memory-init/scripts/nodes/entries.py` — index path + relative links are based at the type directory (same-dir entries; `agent_skills` becomes `../../.agents/skills/...`)
- `extensions/skills/project-memory-init/scripts/operations/init.py` — write seed indexes to `<plural>/AGENTS.md` using type templates
- `extensions/skills/project-memory-init/scripts/operations/add_type.py` — write `<plural>/AGENTS.md`
- `extensions/skills/project-memory-init/scripts/operations/remember.py` — report new index path
- `extensions/skills/project-memory-init/scripts/operations/doctor.py` — `legacy-flat-index` (+ conflict); rewrite stale local links; apply moves then deletes
- Existing tests: `test_user_type.py`, `test_layer_types.py`, `test_add_type.py`, `test_example_types_smoke.py`, `test_user_memory_archive.py`

**Modify (docs / templates / in-repo layers)**

- `extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md` — local links → `.memory/<plural>/AGENTS.md`
- `extensions/skills/project-memory-init/references/templates/USER.tmpl.md` / `AGENT_SKILLS.tmpl.md` — path sentences only (shape unchanged)
- `extensions/skills/project-memory-init/references/LAYOUT.md` — drop “本轮只定意图，不实现”
- Skill docs + changelogs: init, remember, ask, reshape, add-type, doctor, user-memory-backup, user-memory-restore
- `extensions/skills/user-memory-backup/scripts/backup.py` and `user-memory-restore/scripts/restore.py` — pack/restore `users/AGENTS.md`; still accept leftover `USER.md`
- Layer `AGENTS.md` local blocks (root, `extensions/`, `shared-extensions/`, `evaluation/`, `knowledge/tasks/`, `knowledge/teaching/`, `extensions/skills/project-memory-init/`)
- In-repo type indexes: move committed `.memory/FEEDBACK.md` (etc.) → `<plural>/AGENTS.md` via doctor `--apply`
- Root `CHANGELOG.md` `[Unreleased]` project-memory bullet

**Do not create/commit**

- Anything under `knowledge/posts/`
- `knowledge/tasks/` status moves
- `.memory/users/**` or leftover `.memory/USER.md`
- Writes under `.agents/` (except existing skill symlinks)
- A types.json / registry

---

### Shared test preamble

```python
#!/usr/bin/env python3
"""Type indexes live at .memory/<plural>/AGENTS.md (ADR 0012)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
```

Run one file:

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_type_index_as_directory_agents.py -v
```

Full suite after each green step:

```bash
python3 -m unittest discover -s extensions/skills/project-memory-init/scripts/tests -v
```

---

### Task 1: Seed map + init write `<plural>/AGENTS.md`

**Files:**
- Create: `scripts/tests/test_type_index_as_directory_agents.py`
- Modify: `lib/blocks.py`, `lib/paths.py`, `lib/types.py`, `lib/templates.py`, `operations/init.py`, `references/templates/AGENTS.tmpl.md`

**Interfaces:**
- Consumes: current `index_files() -> dict[str, str]`
- Produces: `index_files()["feedback"] == "feedbacks/AGENTS.md"`; `index_files()["user"] == "users/AGENTS.md"`; `index_files()["agent_skills"] == "agent_skills/AGENTS.md"`; `type_index_template_name("feedback") == "FEEDBACK.md"`

- [ ] **Step 1: Write the failing tests**

```python
class SeedIndexPathTests(unittest.TestCase):
    def test_index_files_use_plural_agents(self) -> None:
        from lib.blocks import index_files
        files = index_files()
        self.assertEqual(
            list(files),
            ["user", "feedback", "project", "reference", "skills", "agent_skills"],
        )
        self.assertEqual(files["user"], "users/AGENTS.md")
        self.assertEqual(files["feedback"], "feedbacks/AGENTS.md")
        self.assertEqual(files["agent_skills"], "agent_skills/AGENTS.md")
        self.assertNotIn("USER.md", files.values())

    def test_init_writes_type_agents_from_type_templates(self) -> None:
        from operations.init import init_memory
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            feedback = (target / ".memory" / "feedbacks" / "AGENTS.md").read_text()
            self.assertIn("project-memory-entries:start", feedback)
            self.assertIn("纠正与约束", feedback)
            self.assertNotIn("project-memory-important:start", feedback)
            self.assertFalse((target / ".memory" / "FEEDBACK.md").exists())
            agents = (target / "AGENTS.md").read_text()
            self.assertIn(".memory/feedbacks/AGENTS.md", agents)
            self.assertNotIn(".memory/FEEDBACK.md", agents)
            self.assertTrue((target / ".memory" / "users" / "AGENTS.md").is_file())
            self.assertTrue((target / ".memory" / "agent_skills" / "AGENTS.md").is_file())
            self.assertFalse((target / ".agents").exists())
```

- [ ] **Step 2: Run tests to verify they fail**

Expected: `index_files()["feedback"]` is still `FEEDBACK.md`.

- [ ] **Step 3: Minimal implementation**

1. `AGENTS.tmpl.md` local lines become `.memory/users/AGENTS.md`, `.memory/feedbacks/AGENTS.md`, `.memory/projects/AGENTS.md`, `.memory/references/AGENTS.md`, `.memory/skills/AGENTS.md`, `.memory/agent_skills/AGENTS.md`.
2. `MEMORY_INDEX_LINK_PATTERN` captures the plural directory:
   `]\(\.memory/([^/\s)]+)/AGENTS\.md\)`.
3. `type_from_dir_name("users") == "user"` via a small seed inverse (`users`/`feedbacks`/`projects`/`references`); identity for `skills` / `agent_skills` / `docs`.
4. `index_file_name(t) -> f"{type_dir_name(t)}/AGENTS.md"`.
5. `type_index_template_name(t) -> f"{t.upper()}.md"` for `read_template` / `read_index_template`.
6. `init` writes `memory_dir / index_file_name(type)` using the type template, not `AGENTS.tmpl.md`.

- [ ] **Step 4: Run the new tests — expect PASS**
- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-09-17-type-index-as-directory-agents.md \
  extensions/skills/project-memory-init
git commit -m "feat: type indexes live at plural/AGENTS.md"
```

---

### Task 2: Discovery, remember, add-type, relative entry links

**Files:**
- Modify: `lib/types.py`, `nodes/entries.py`, `operations/add_type.py`, `operations/remember.py`
- Modify existing tests that still assert `.memory/USER.md` / `.memory/DOCS.md`

**Interfaces:**
- `discover_layer_types(target)["feedback"] == "feedbacks/AGENTS.md"`
- `discover_layer_types` also finds `.memory/docs/AGENTS.md` (and type-meta `name:`)
- `add_type(..., "docs")["index"] == ".memory/docs/AGENTS.md"`
- `remember(..., "user")["index"] == ".memory/users/AGENTS.md"`
- Feedback entry links are `feedback_<slug>.md` (same directory)
- `agent_skills` entry links are `../../.agents/skills/<name>/SKILL.md`

- [ ] **Step 1: Failing tests**

```python
class RememberAndAddTypePathTests(unittest.TestCase):
    def test_remember_feedback_indexes_same_dir(self) -> None:
        from operations.init import init_memory
        from operations.remember import remember
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            result = remember(
                target, "feedback", "no_flat_index",
                "Do not write flat TYPE.md",
                "type index is feedbacks/AGENTS.md",
                "Use the colocated index.\n\n**Why:** ADR 0012.\n\n**How to apply:** open feedbacks/AGENTS.md.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertEqual(result["index"], ".memory/feedbacks/AGENTS.md")
            index = (target / ".memory" / "feedbacks" / "AGENTS.md").read_text()
            self.assertIn("](feedback_no_flat_index.md)", index)
            self.assertNotIn("feedbacks/feedback_no_flat_index.md", index)

    def test_add_type_docs_writes_docs_agents(self) -> None:
        from operations.add_type import add_type
        from operations.init import init_memory
        from lib.types import discover_layer_types
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            result = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(result["index"], ".memory/docs/AGENTS.md")
            self.assertTrue((target / ".memory" / "docs" / "AGENTS.md").is_file())
            self.assertFalse((target / ".memory" / "DOCS.md").exists())
            self.assertEqual(discover_layer_types(target)["docs"], "docs/AGENTS.md")
            self.assertIn(".memory/docs/AGENTS.md", (target / "AGENTS.md").read_text())
```

- [ ] **Step 2: Confirm RED**
- [ ] **Step 3: Implement**

- `discover_layer_types`: parse new local links; also glob `.memory/*/AGENTS.md` that contain `project-memory-entries`; type name from privilege `name:` else `type_from_dir_name`.
- `upsert_local_type_line(document, "docs/AGENTS.md", desc)` → `.memory/docs/AGENTS.md`.
- `build_entry_index` uses `relative_link(path, type_index_path(target, type).parent)`.
- Do not treat type `AGENTS.md` as a memory entry (`list_type_files` already uses `type_*.md` / `*/SKILL.md`).

- [ ] **Step 4: Update existing tests** to the new paths (`test_user_type.py`, `test_layer_types.py`, `test_add_type.py`, `test_example_types_smoke.py`). Keep gitignore assertions for leftover `USER.md`.
- [ ] **Step 5: Full suite green, then commit**

---

### Task 3: Doctor migrates leftover flat indexes

**Files:**
- Modify: `operations/doctor.py`, `scripts/tests/test_type_index_as_directory_agents.py`
- Modify: `project-memory-doctor/SKILL.md` + `CHANGELOG.md`

**Interfaces:**
- New finding `legacy-flat-index` with `path=.memory/FEEDBACK.md` and `destination=.memory/feedbacks/AGENTS.md`
- `legacy-flat-index-conflict` when both exist and differ
- apply: mkdir dest parent, write dest from source, unlink source, rewrite layer local links, refresh indexes
- Never create or write `.agents/`

- [ ] **Step 1: Failing tests**

```python
class DoctorLegacyFlatIndexTests(unittest.TestCase):
    def test_migrates_feedback_md_then_deletes_old(self) -> None:
        from operations.doctor import doctor_memory
        from operations.init import init_memory
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            old = target / ".memory" / "FEEDBACK.md"
            new = target / ".memory" / "feedbacks" / "AGENTS.md"
            body = new.read_text(encoding="utf-8")
            old.write_text(body.replace("暂无条目。", "- leftover intro kept\n"), encoding="utf-8")
            new.unlink()
            agents = target / "AGENTS.md"
            agents.write_text(
                agents.read_text(encoding="utf-8").replace(
                    ".memory/feedbacks/AGENTS.md", ".memory/FEEDBACK.md"
                ),
                encoding="utf-8",
            )
            diagnosed = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in diagnosed["findings"]}
            self.assertIn("legacy-flat-index", issues)
            doctor_memory(target, apply=True)
            self.assertTrue(new.is_file())
            self.assertFalse(old.exists())
            self.assertIn(".memory/feedbacks/AGENTS.md", agents.read_text())
            self.assertNotIn(".memory/FEEDBACK.md", agents.read_text())
            self.assertEqual(doctor_memory(target, apply=False)["findings"], [])

    def test_agent_skills_migration_does_not_touch_agents_dir(self) -> None:
        from operations.doctor import doctor_memory
        from operations.init import init_memory
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            old = target / ".memory" / "AGENT_SKILLS.md"
            new = target / ".memory" / "agent_skills" / "AGENTS.md"
            old.write_text(new.read_text(encoding="utf-8"), encoding="utf-8")
            new.unlink()
            doctor_memory(target, apply=True)
            self.assertTrue(new.is_file())
            self.assertFalse(old.exists())
            self.assertFalse((target / ".agents").exists())
```

- [ ] **Step 2: Confirm RED**
- [ ] **Step 3: Implement scan + apply**
  - Scan `.memory/*.md` matching `^[A-Z][A-Z0-9_]*\.md$` with an entries block.
  - Destination = `type_index_path(owner, stem.lower())`.
  - Apply in the existing rename pass; then refresh indexes; then `ensure_seed_local_lines` + drop leftover `.memory/TYPE.md` local lines.
  - `outdated-local` compares type names, not `Path(file).stem` (which would be `AGENTS` for every type).
- [ ] **Step 4: Suite green, commit**

---

### Task 4: Backup/restore + skill docs + in-repo refresh

**Files:**
- `user-memory-backup` / `user-memory-restore` scripts + tests
- Skill SKILL.md / CHANGELOG.md listed in the file map
- LAYOUT.md, root CHANGELOG, in-repo layer AGENTS + committed type indexes

- [ ] **Step 1:** Backup already rglob’s `users/`; keep packing leftover `USER.md`. Restore allows `.memory/users/AGENTS.md` and leftover `USER.md`. Occupied-check treats `users/AGENTS.md` like the old index.
- [ ] **Step 2:** Update skill prose paths (`users/AGENTS.md`, `feedbacks/AGENTS.md`, `agent_skills/AGENTS.md`). Ask stays protocol-shaped; only mention that type indexes are the linked `AGENTS.md` files.
- [ ] **Step 3:** `LAYOUT.md`: replace “本轮只定意图，不实现” with “doctor 认 `legacy-flat-index`，搬到 `<plural>/AGENTS.md` 后删除旧文件”.
- [ ] **Step 4:** Run doctor `--apply` on this repo. Commit migrated indexes and refreshed local blocks. Do **not** `git add` `.memory/users/` or `.memory/USER.md`. Confirm `git check-ignore` still hits leftover `USER.md`.
- [ ] **Step 5:** Full unittest suite. Commit + push + open one PR against `main`.

---

## Self-review

1. **Spec coverage:** location, two contracts, discovery via local links, type templates not layer template, `user`/`agent_skills` specials, doctor migrate+delete, docs/hardcoded paths, in-repo refresh, no user-memory commit — each has a task.
2. **Placeholders:** none; tests and paths are concrete.
3. **Types:** `index_file_name` / `type_index_template_name` / `legacy-flat-index` stay consistent across tasks.
