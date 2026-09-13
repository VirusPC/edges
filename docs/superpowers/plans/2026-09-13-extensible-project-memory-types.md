# Extensible Project Memory Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a layer register extra Memory Types through LAYOUT artifacts and `$project-memory-add-type`, while official init seeds stay the six built-ins and remember / ask / doctor discover those extras from the layer — no JSON registry, no PROTOCOL type closed set.

**Architecture:** Keep `index_files()` as the **init seed** map derived from `AGENTS.tmpl.md`. Add a layer discovery function that reads that layer’s `AGENTS.md` local block plus `.memory/*.md` entry files (the LAYOUT products). `$project-memory-add-type` is a thin skill over a new `memory.py add-type` operation in the shared `project-memory-init` scripts: write `.memory/<TYPE>.md`, `.memory/<plural>/`, and one AGENTS local line. Privilege flags live in an HTML comment on the entry file (LAYOUT, not a registry) and are applied by the current Python scripts the same way `user` gitignore works today. `sync_target_agents` / doctor `--apply` must **merge** extra local lines, never replace the local block with the seed-only template.

**Tech Stack:** Python 3 stdlib (`unittest`, `argparse`, `pathlib`, `re`, `dataclasses`), existing `scripts/memory.py` CLI, Agent Skills frontmatter + Keep a Changelog. No new YAML/JSON library. No `edges` CLI work.

**Spec:** `docs/adr/0006-extensible-project-memory-types.md` (accepted). Glossary: `CONTEXT.md` terms **Memory Type（项目记忆）**, **可扩展 Memory Type**. Layout/protocol: `extensions/skills/project-memory-init/references/LAYOUT.md`, `PROTOCOL.md` (PROTOCOL stays non-enumerating). Built-in privilege precedent: `docs/adr/0003-user-memory-in-repo-gitignored.md`. Seed type-set: `extensions/skills/project-memory-init/.memory/projects/project_type_set.md`. Capability Surface: `docs/adr/0004-capability-surface-cli-skill-mcp.md`. Out-of-scope backlogs: `knowledge/tasks/backlog/2026-09-13--project-memory脚本迁到edges-CLI.md`, `knowledge/tasks/backlog/2026-09-13--tasks-memory与看板语义合并.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording, if mentioned: always **CLI + Skill + MCP** (three peers). Never “必要时 MCP”, never “CLI + Skill” as the Edges shorthand
- This round’s action is **Skill** (`$project-memory-add-type`) plus the current Python `memory.py` scripts. Do **not** wait for, or start, the `edges` CLI migration
- LAYOUT-only extension: entry file + plural dir + AGENTS local line. **No** JSON/YAML type registry
- PROTOCOL does **not** enumerate types; do not add a type closed set there
- Official init seeds stay exactly: `user` / `feedback` / `project` / `reference` / `skills` / `agent_skills`
- User-added types are isomorphic to seeds (same entry / plural / remember path) unless a privilege flag says otherwise
- remember / ask / doctor **discover** extra types from that layer’s AGENTS / entry artifacts; they must not assume only the six seeds
- Privilege flags: implement in current Python when feasible (gitignore like ADR-0003, index-only like `agent_skills`, skills-format like `skills`); stub only if too heavy; name the stub in code and SKILL.md
- Example types `docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler` are **docs/tests smoke only** — not official init seeds
- `tasks` Memory Type is an ordinary LAYOUT type (`.memory/TASKS.md` + `.memory/tasks/`). It is **not** `knowledge/tasks/` and must not touch the board
- Do **not** change `knowledge/tasks` board status or task bodies
- Do **not** auto-create/edit/move/delete `knowledge/posts/`
- Do **not** implement `$project-memory-add-type` in the plan-only PR that first lands this file
- Public repo: no credentials, tokens, or personal data in commits
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`
- Skill change order (from `project-memory-init` hard constraint): `PROTOCOL.md` → `LAYOUT.md` → `project-memory-init` → other non-doctor skills → `project-memory-doctor`

---

## File map

**Create**

- `extensions/skills/project-memory-init/scripts/lib/types.py` — `TypeSpec`, seed vs layer discovery, privilege parse/render, type-name validation
- `extensions/skills/project-memory-init/scripts/operations/add_type.py` — `add_type(...)` writes LAYOUT artifacts
- `extensions/skills/project-memory-init/references/templates/TYPE.tmpl.md` — generic user-type entry (not a seed)
- `extensions/skills/project-memory-init/scripts/tests/test_layer_types.py` — discovery + seed isolation
- `extensions/skills/project-memory-init/scripts/tests/test_add_type.py` — add-type + privileges + no-wipe
- `extensions/skills/project-memory-init/scripts/tests/test_example_types_smoke.py` — six example names, tests only
- `extensions/skills/project-memory-add-type/SKILL.md`
- `extensions/skills/project-memory-add-type/CHANGELOG.md`

**Modify**

- `extensions/skills/project-memory-init/scripts/lib/blocks.py` — keep `index_files()` as **seeds**; stop calling the local block a closed set; add `TYPE_META_*` markers next to the other HTML comments
- `extensions/skills/project-memory-init/scripts/lib/paths.py` — no new external-root table rows this round (`EXTERNAL_CONTENT_DIRS` stays `{agent_skills: ...}`)
- `extensions/skills/project-memory-init/scripts/nodes/agents.py` — `sync_target_agents` / new-AGENTS path must merge extras, not `build_local_block()` alone
- `extensions/skills/project-memory-init/scripts/nodes/entries.py` — `refresh_index` / `expected_index_document` / `resolve_memory_path` / `ordinary_memory_types` take a target and use layer discovery; generic `TYPE.tmpl.md` fallback
- `extensions/skills/project-memory-init/scripts/operations/init.py` — still create only seed dirs/indexes; after extras exist, refresh them too; do not wipe AGENTS extras
- `extensions/skills/project-memory-init/scripts/operations/remember.py` — refresh discovered types; `sync_target_agents` must not drop extras
- `extensions/skills/project-memory-init/scripts/operations/doctor.py` — per-layer expected types = discovered ∪ seeds; apply must not call seed-only `build_local_block()`
- `extensions/skills/project-memory-init/scripts/memory.py` — `add-type` subcommand; remember `--type` is no longer a static `choices=` list
- `extensions/skills/project-memory-init/scripts/operations/__init__.py` — docstring: four operations
- `extensions/skills/project-memory-init/scripts/OVERVIEW.md` — discovery + add-type + “加普通类型” is add-type, not only editing the seed template
- `extensions/skills/project-memory-init/references/LAYOUT.md` — extension surface, privilege comment, discovery, heading count-free; do **not** add example types to the seed table
- `extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md` — 「下面六个」→「下面这些」（count-free). **Do not** add docs/progress/tasks/… links
- `extensions/skills/project-memory-init/SKILL.md` + `CHANGELOG.md`
- `extensions/skills/project-memory-remember/SKILL.md` + `CHANGELOG.md`
- `extensions/skills/project-memory-ask/SKILL.md` + `CHANGELOG.md`
- `extensions/skills/project-memory-doctor/SKILL.md` + `CHANGELOG.md` (doctor last)
- `extensions/skills/project-memory-reshape/SKILL.md` + `CHANGELOG.md`
- `CHANGELOG.md` `[Unreleased]` — new skill + discovery (when implementation lands). This plan-only change adds the plan-file line
- `.agents/skills/project-memory-add-type` — relative symlink via `pnpm skills:link`

**Do not create/commit**

- Any `types.json` / `types.yaml` / `.memory/registry*`
- PROTOCOL type enumeration or a PROTOCOL closed set
- Official seed rows for `docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler`
- `extensions/clis` / `edges` CLI verbs for add-type
- MCP tool for add-type (same backlog as other project-memory scripts)
- Edits under `knowledge/posts/`
- `knowledge/tasks/` status moves or a merge of `tasks` Memory Type into the board
- A new `EXTERNAL_CONTENT_DIRS` user-type (stub: reject `--external-content-dir`)

---

### Shared test preamble (every new test file)

Copy this header; do not invent a different `sys.path` dance:

```python
#!/usr/bin/env python3
"""Layer Memory Type discovery and add-type (ADR 0006)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
```

Run any single file as:

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py -v
```

Regression after each implementation step:

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py -v
```

---

### Task 1: Seed map vs layer discovery

**Files:**
- Create: `extensions/skills/project-memory-init/scripts/lib/types.py`
- Create: `extensions/skills/project-memory-init/scripts/tests/test_layer_types.py`
- Modify: `extensions/skills/project-memory-init/scripts/lib/blocks.py` (comment on `index_files` / `build_local_block` only if needed; keep the functions)

**Interfaces:**
- Consumes: `lib.blocks.index_files() -> dict[str, str]`, `MEMORY_INDEX_LINK_PATTERN`, `LOCAL_START` / `LOCAL_END` / `ENTRIES_START`, `lib.paths.memory_dir`, `AGENTS_FILE_NAME`
- Produces:
  - `@dataclass(frozen=True) class TypeSpec` with fields `name: str`, `index_file: str`, `description: str`, `writable: bool`, `gitignore: bool`, `format: str` (`"ordinary"` | `"skills"`)
  - `SEED_TYPE_NAMES: tuple[str, ...] = ("user", "feedback", "project", "reference", "skills", "agent_skills")`
  - `seed_index_files() -> dict[str, str]` — thin wrapper around `index_files()`
  - `index_file_name(entry_type: str) -> str` — `docs` → `DOCS.md`, `agent_skills` → `AGENT_SKILLS.md` (`entry_type.upper() + ".md"`)
  - `validate_type_name(entry_type: str) -> str` — strip, lower; must match `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`; reject seeds
  - `discover_layer_types(target: Path) -> dict[str, str]` — `name → index filename`, AGENTS local order first, then extra `.memory/[A-Z][A-Z0-9_]*.md` that contain `project-memory-entries` markers
  - `layer_type_specs(target: Path) -> list[TypeSpec]`
  - `layer_writable_types(target: Path) -> tuple[str, ...]` — discovered names that are writable (not `agent_skills`, not `writable=False`)

- [ ] **Step 1: Write the failing test**

```python
from lib.blocks import index_files
from lib.types import (  # noqa: E402
    SEED_TYPE_NAMES,
    discover_layer_types,
    index_file_name,
    seed_index_files,
    validate_type_name,
)
from operations.init import init_memory  # noqa: E402


class SeedIsolationTests(unittest.TestCase):
    def test_seed_index_files_is_the_template_map(self) -> None:
        self.assertEqual(seed_index_files(), index_files())
        self.assertEqual(
            list(seed_index_files()),
            ["user", "feedback", "project", "reference", "skills", "agent_skills"],
        )
        self.assertEqual(SEED_TYPE_NAMES, tuple(seed_index_files()))

    def test_init_seeds_do_not_include_example_types(self) -> None:
        files = seed_index_files()
        for name in ("docs", "progress", "tasks", "research", "reminder", "scheduler"):
            self.assertNotIn(name, files)

    def test_index_file_name_uppercases(self) -> None:
        self.assertEqual(index_file_name("docs"), "DOCS.md")
        self.assertEqual(index_file_name("agent_skills"), "AGENT_SKILLS.md")


class ValidateTypeNameTests(unittest.TestCase):
    def test_accepts_snake_case(self) -> None:
        self.assertEqual(validate_type_name("docs"), "docs")
        self.assertEqual(validate_type_name("my_type"), "my_type")

    def test_rejects_seeds(self) -> None:
        with self.assertRaises(ValueError) as ctx:
            validate_type_name("project")
        self.assertIn("官方种子", str(ctx.exception))

    def test_rejects_kebab_and_caps(self) -> None:
        with self.assertRaises(ValueError):
            validate_type_name("my-type")
        with self.assertRaises(ValueError):
            validate_type_name("Docs")


class DiscoverLayerTypesTests(unittest.TestCase):
    def test_fresh_init_discovers_only_seeds(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            self.assertEqual(
                list(discover_layer_types(target)),
                list(seed_index_files()),
            )

    def test_discovers_extra_type_from_agents_local_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            agents = target / "AGENTS.md"
            text = agents.read_text(encoding="utf-8")
            text = text.replace(
                "<!-- project-memory-local:end -->",
                "- [.memory/DOCS.md](.memory/DOCS.md) — 文档指针\n"
                "<!-- project-memory-local:end -->",
            )
            agents.write_text(text, encoding="utf-8")
            (target / ".memory" / "DOCS.md").write_text(
                "<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            discovered = discover_layer_types(target)
            self.assertIn("docs", discovered)
            self.assertEqual(discovered["docs"], "DOCS.md")
            self.assertEqual(list(discovered)[:6], list(seed_index_files()))
            self.assertEqual(list(discovered)[-1], "docs")

    def test_discovers_entry_file_not_yet_listed_in_agents(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            (target / ".memory" / "RESEARCH.md").write_text(
                "<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            discovered = discover_layer_types(target)
            self.assertEqual(discovered["research"], "RESEARCH.md")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py -v
```

Expected: `ModuleNotFoundError: No module named 'lib.types'` (or `ImportError`).

- [ ] **Step 3: Write minimal implementation**

Create `lib/types.py`:

```python
#!/usr/bin/env python3
"""Memory Type 种子与本层发现。类型集合在 LAYOUT 产物里，不在 JSON 注册表。"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from lib.blocks import (
    ENTRIES_START,
    LOCAL_END,
    LOCAL_START,
    MEMORY_INDEX_LINK_PATTERN,
    block_pattern,
    index_files,
)
from lib.paths import AGENTS_FILE_NAME, is_external_type, memory_dir

SEED_TYPE_NAMES: tuple[str, ...] = (
    "user",
    "feedback",
    "project",
    "reference",
    "skills",
    "agent_skills",
)
TYPE_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
TYPE_INDEX_NAME_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*\.md$")


@dataclass(frozen=True)
class TypeSpec:
    name: str
    index_file: str
    description: str = ""
    writable: bool = True
    gitignore: bool = False
    format: str = "ordinary"


def seed_index_files() -> dict[str, str]:
    """官方 init 种子：仍从 AGENTS.tmpl.md 推导。"""
    return index_files()


def index_file_name(entry_type: str) -> str:
    return f"{entry_type.upper()}.md"


def validate_type_name(entry_type: str) -> str:
    name = (entry_type or "").strip().lower()
    if name in SEED_TYPE_NAMES:
        raise ValueError(f"不能用 add-type 登记官方种子类型: {name}")
    if not TYPE_NAME_PATTERN.fullmatch(name):
        raise ValueError(
            "--name 必须是小写 snake_case，例如 docs 或 my_type，不能用 kebab-case"
        )
    return name


def discover_layer_types(target: Path) -> dict[str, str]:
    """从该层 AGENTS.md 本层清单 + `.memory/*.md` 入口产物发现 type → 入口文件名。"""
    types: dict[str, str] = {}
    agents = target / AGENTS_FILE_NAME
    if agents.is_file():
        match = block_pattern(LOCAL_START, LOCAL_END).search(
            agents.read_text(encoding="utf-8")
        )
        if match:
            for raw in MEMORY_INDEX_LINK_PATTERN.findall(match.group(0)):
                types[raw.lower()] = f"{raw}.md"
    directory = memory_dir(target)
    if directory.is_dir():
        for path in sorted(directory.glob("*.md")):
            if not TYPE_INDEX_NAME_PATTERN.fullmatch(path.name):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeError):
                continue
            if ENTRIES_START not in text:
                continue
            types.setdefault(path.stem.lower(), path.name)
    return types


def layer_writable_types(target: Path) -> tuple[str, ...]:
    return tuple(
        name for name in discover_layer_types(target) if not is_external_type(name)
    )
```

Leave `layer_type_specs` for Task 6 (privilege comment). Task 1 tests only need the functions above; if you already added a stub `layer_type_specs` that ignores the comment block, have it default `writable=not is_external_type(name)`, `gitignore=(name == "user")`, `format="skills"` for `skills` / `agent_skills`.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py UserTypeRegistrationTests -v
```

Expected: PASS. `test_user_type.py` still sees `index_files()` as the six seeds.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/lib/types.py \
        extensions/skills/project-memory-init/scripts/tests/test_layer_types.py
git commit -m "feat(memory): discover layer Memory Types from AGENTS artifacts

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: Stop wiping extra local lines

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/nodes/agents.py`
- Modify: `extensions/skills/project-memory-init/scripts/lib/types.py` — add `build_layer_local_block`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_layer_types.py`
- Modify: `extensions/skills/project-memory-init/scripts/operations/init.py` (call site only if `sync_target_agents` signature stays the same)

**Interfaces:**
- Consumes: `build_local_block() -> str` (seed-only, brand-new AGENTS.md)
- Produces:
  - `upsert_local_type_line(document: str, index_file: str, description: str) -> str` — insert or keep the `.memory/FOO.md` line; never delete other type lines
  - `ensure_seed_local_lines(document: str) -> str` — insert any missing **seed** links in seed order; keep extras
  - `sync_target_agents(target: Path, root: Path) -> str` — new file: seed `build_local_block()`; existing file: `ensure_seed_local_lines` only

This is the ADR 0006 load-bearing fix. Today `sync_target_agents` always writes `local=build_local_block()`, so remember / init / doctor `--apply` would delete a hand-added or add-type line.

- [ ] **Step 1: Write the failing test**

```python
from operations.remember import remember  # noqa: E402


class PreserveExtraTypesTests(unittest.TestCase):
    def _add_docs_line(self, target: Path) -> None:
        agents = target / "AGENTS.md"
        text = agents.read_text(encoding="utf-8")
        agents.write_text(
            text.replace(
                "<!-- project-memory-local:end -->",
                "- [.memory/DOCS.md](.memory/DOCS.md) — 文档指针\n"
                "<!-- project-memory-local:end -->",
            ),
            encoding="utf-8",
        )
        (target / ".memory" / "DOCS.md").write_text(
            "<!-- project-memory-entries:start -->\n- 暂无条目。\n"
            "<!-- project-memory-entries:end -->\n",
            encoding="utf-8",
        )
        (target / ".memory" / "docs").mkdir(exist_ok=True)

    def test_init_on_existing_layer_keeps_extra_local_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            self._add_docs_line(target)
            init_memory(target, target, "temp tree")
            local = (target / "AGENTS.md").read_text(encoding="utf-8")
            self.assertIn(".memory/DOCS.md", local)
            self.assertIn(".memory/USER.md", local)

    def test_remember_does_not_drop_extra_local_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            self._add_docs_line(target)
            remember(
                target,
                "project",
                "keep_docs_line",
                "Keep extra type line",
                "remember must not rewrite local block back to seeds only",
                "Extra types stay.\n\n**Why:** ADR 0006 discovery.\n\n"
                "**How to apply:** merge, do not replace.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertIn(
                ".memory/DOCS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py PreserveExtraTypesTests -v
```

Expected: FAIL — after `init_memory` / `remember`, `.memory/DOCS.md` is gone from `AGENTS.md` because `sync_target_agents` wrote `build_local_block()`.

- [ ] **Step 3: Write minimal implementation**

In `lib/types.py` (or `nodes/agents.py` if you prefer the AGENTS node to own document surgery):

```python
from lib.blocks import LOCAL_END, LOCAL_START, block_pattern, build_local_block
from lib.templates import ENTRY_LINE_TEMPLATE, render_line


def upsert_local_type_line(document: str, index_file: str, description: str) -> str:
    relative = f".memory/{index_file}"
    line = render_line(
        ENTRY_LINE_TEMPLATE,
        {"title": relative, "path": relative, "description": description},
    )
    match = block_pattern(LOCAL_START, LOCAL_END).search(document)
    if match is None:
        raise ValueError("AGENTS.md 缺少本层记忆区块，请先 init")
    block = match.group(0)
    entry_pattern = re.compile(
        rf"^- \[[^\]]*\]\({re.escape(relative)}\)(?: — .*)?$",
        re.MULTILINE,
    )
    if entry_pattern.search(block):
        return document
    updated_block = block.replace(LOCAL_END, f"{line}\n{LOCAL_END}", 1)
    return document[: match.start()] + updated_block + document[match.end() :]


def ensure_seed_local_lines(document: str) -> str:
    """补上缺失的种子行，不删除额外 type 行。"""
    if block_pattern(LOCAL_START, LOCAL_END).search(document) is None:
        return document
    seed_block = build_local_block()
    for raw in MEMORY_INDEX_LINK_PATTERN.findall(seed_block):
        desc_match = re.search(
            rf"\]\(\.memory/{re.escape(raw)}\.md\)(?: — (.*))?$",
            seed_block,
            re.MULTILINE,
        )
        description = (desc_match.group(1) if desc_match else "").strip()
        document = upsert_local_type_line(
            document, f"{raw}.md", description
        )
    return document
```

Change `sync_target_agents`:

```python
def sync_target_agents(target: Path, root: Path) -> str:
    """维护目标目录的 AGENTS.md：本层硬约束与本层记忆区块。

    新文件用种子清单。已有文件只保证种子行在，额外 type 行原样保留。
    """
    path = target / AGENTS_FILE_NAME
    if classify_agents_file(path) == "missing":
        return sync_agents_blocks(target, local=build_local_block())
    existing = path.read_text(encoding="utf-8")
    updated = ensure_seed_local_lines(existing)
    if updated != existing:
        # Re-enter through sync_agents_blocks so important / auto 清理仍走原路径。
        match = block_pattern(LOCAL_START, LOCAL_END).search(updated)
        local = match.group(0) if match else build_local_block()
        return sync_agents_blocks(target, local=local)
    return sync_agents_blocks(target, local="")
```

`sync_agents_blocks(..., local="")` already means “do not upsert the local block”. Confirm that path still runs `ensure_important_block` / `drop_auto_block`. If `local=""` skips too much, pass the merged local block every time instead.

Do **not** change `render_agents_document` for brand-new files — those still get the seed template.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py PreserveExtraTypesTests -v
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/lib/types.py \
        extensions/skills/project-memory-init/scripts/nodes/agents.py \
        extensions/skills/project-memory-init/scripts/tests/test_layer_types.py
git commit -m "fix(memory): keep extra AGENTS type lines across init and remember

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: remember writes discovered types

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/nodes/entries.py`
- Modify: `extensions/skills/project-memory-init/scripts/operations/remember.py`
- Modify: `extensions/skills/project-memory-init/scripts/memory.py`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_layer_types.py`

**Interfaces:**
- Consumes: `discover_layer_types(target)`, `layer_writable_types(target)`, `index_file_name`
- Produces:
  - `resolve_memory_path(target, entry_type, slug)` accepts any `layer_writable_types(target)` name
  - `refresh_index(target, entry_type)` / `expected_index_document(target, entry_type)` look up the index file from `discover_layer_types(target)` (fallback `index_file_name`)
  - `remember(...)` refreshes **discovered** types, not `index_files()` only
  - `memory.py` remember `--type` has **no** `choices=sorted(memory_entry_types())`; after `resolve_target`, reject unknown / non-writable types with `ValueError`

`argparse` choices are built before `--target-dir` is known. Static seed choices would make `--type docs` a hard CLI error. Drop `choices=`. Help text lists the six seeds and says extra names are whatever that layer’s AGENTS.md already registered.

- [ ] **Step 1: Write the failing test**

```python
class RememberDiscoveredTypeTests(unittest.TestCase):
    def test_remember_docs_writes_entry_and_index(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            agents = target / "AGENTS.md"
            agents.write_text(
                agents.read_text(encoding="utf-8").replace(
                    "<!-- project-memory-local:end -->",
                    "- [.memory/DOCS.md](.memory/DOCS.md) — 文档指针\n"
                    "<!-- project-memory-local:end -->",
                ),
                encoding="utf-8",
            )
            (target / ".memory" / "docs").mkdir()
            (target / ".memory" / "DOCS.md").write_text(
                "# DOCS\n\n<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            result = remember(
                target,
                "docs",
                "layout_only",
                "LAYOUT-only extra type",
                "user-added docs type must be writable like seeds",
                "Treat extra types as ordinary memory.\n\n"
                "**Why:** ADR 0006 isomorphic types.\n\n"
                "**How to apply:** discover then remember.",
                {"username": "tester", "email": "t@example.com"},
            )
            path = target / ".memory" / "docs" / "docs_layout_only.md"
            self.assertTrue(path.is_file(), result)
            self.assertEqual(result["path"], ".memory/docs/docs_layout_only.md")
            self.assertEqual(result["index"], ".memory/DOCS.md")
            self.assertIn("docs_layout_only.md", (target / ".memory" / "DOCS.md").read_text())
```

Also add a CLI test in the same class (or in `test_frontmatter.py` style) that runs `memory.py remember --type docs ...` and expects `ok: true` after the argparse change.

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py RememberDiscoveredTypeTests -v
```

Expected: FAIL — `resolve_memory_path` raises `--type 不支持由 remember 写入: docs` because `memory_entry_types()` is seed-only. `expected_index_document` would `KeyError` on `index_files()["docs"]`.

- [ ] **Step 3: Write minimal implementation**

In `nodes/entries.py`:

```python
from lib.types import discover_layer_types, layer_writable_types, index_file_name


def memory_entry_types(target: Path | None = None) -> tuple[str, ...]:
    """可写类型。无 target 时仍是官方种子（init / 帮助文案）。"""
    if target is None:
        return tuple(name for name in index_files() if not is_external_type(name))
    return layer_writable_types(target)


def resolve_memory_path(target: Path, entry_type: str, slug: str | None) -> Path:
    if entry_type not in memory_entry_types(target):
        raise ValueError(f"--type 未在该层登记为可写类型: {entry_type}")
    # ... existing slug rules ...
    # prefix check: use discover_layer_types(target) or seed_index_files(),
    # not index_files() alone, so extra prefixes are also stripped from --slug


def expected_index_document(target: Path, entry_type: str) -> str:
    file_name = discover_layer_types(target).get(entry_type) or index_file_name(entry_type)
    path = memory_dir(target) / file_name
    existing = (
        path.read_text(encoding="utf-8")
        if path.is_file()
        else read_template(file_name)  # Task 4 adds TYPE.tmpl.md fallback
    )
    ...
```

Every current `memory_entry_types()` call site:

| Site | Pass `target`? |
| --- | --- |
| `memory.py` argparse `choices=` | **Remove `choices=`** |
| `resolve_memory_path` | yes |
| `ordinary_memory_types` | add optional `target`; doctor passes `owner` |
| `init.py` legacy flat-file scan | seed-only is OK (`target=None`) |

In `operations/remember.py`:

```python
    for declared_type in discover_layer_types(target):
        refresh_index(target, declared_type)
    index_path = memory_dir(target) / (
        discover_layer_types(target).get(entry_type) or index_file_name(entry_type)
    )
```

In `memory.py` `build_parser` remember `--type`:

```python
    remember_parser.add_argument(
        "--type",
        required=True,
        help=(
            "该层已登记的可写类型。官方种子: "
            "feedback / project / reference / skills / user；"
            "另加该层 AGENTS.md 本层清单里的用户类型。"
            "agent_skills 只索引，不能 remember"
        ),
    )
```

In `main()`, after `resolve_target`:

```python
        if arguments.operation == "remember":
            writable = layer_writable_types(target)
            if arguments.type not in writable:
                raise ValueError(
                    f"--type 未在该层登记为可写类型: {arguments.type}。"
                    f"已登记可写类型: {', '.join(writable) or '(none)'}"
                )
```

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py RememberDiscoveredTypeTests -v
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
```

Expected: PASS. Existing `--type project` CLI test still works without `choices=`.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/nodes/entries.py \
        extensions/skills/project-memory-init/scripts/operations/remember.py \
        extensions/skills/project-memory-init/scripts/memory.py \
        extensions/skills/project-memory-init/scripts/tests/test_layer_types.py
git commit -m "feat(memory): remember user-added Memory Types discovered on the layer

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: Generic `TYPE.tmpl.md` fallback

**Files:**
- Create: `extensions/skills/project-memory-init/references/templates/TYPE.tmpl.md`
- Modify: `extensions/skills/project-memory-init/scripts/lib/templates.py` — optional helper `read_type_entry_template`
- Modify: `extensions/skills/project-memory-init/scripts/nodes/entries.py` — `expected_index_document` fallback
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_layer_types.py`

**Interfaces:**
- Consumes: `read_template(output_name)` (raises if `DOCS.tmpl.md` missing)
- Produces: `read_index_template(file_name: str, entry_type: str, description: str) -> str` — seed file if `template_path(file_name)` exists, else fill `TYPE.tmpl.md`

There is no `DOCS.tmpl.md`. Today `expected_index_document` calls `read_template("DOCS.md")` and blows up when the entry file is missing. add-type will create the file; doctor `missing-index` and remember-on-empty-layer still need a generic template.

- [ ] **Step 1: Write the failing test**

```python
from nodes.entries import expected_index_document  # noqa: E402


class TypeTemplateTests(unittest.TestCase):
    def test_expected_index_uses_generic_template_for_unknown_type(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            document = expected_index_document(target, "docs")
            self.assertIn("project-memory-entries:start", document)
            self.assertIn("docs", document.lower())
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py TypeTemplateTests -v
```

Expected: FAIL — `ValueError: 模板不存在: .../DOCS.tmpl.md`.

- [ ] **Step 3: Write minimal implementation**

`TYPE.tmpl.md`:

```markdown
# {NAME} — {description}

> 记：{description}
> 不记：官方 init 种子已经覆盖的类型闸门；不要把看板 `knowledge/tasks` 当成这个入口。
> 怎么写：正文先一句结论，再跟 `**Why:**` 与 `**How to apply:**`。
> 本文件只是索引，条目区块由脚本重算，正文写在 `{plural}/{type}_<slug>.md` 里。

<!-- project-memory-type:start -->
name: {type}
description: {description}
gitignore: {gitignore}
writable: {writable}
format: {format}
<!-- project-memory-type:end -->

<!-- project-memory-entries:start -->
- 暂无条目。
<!-- project-memory-entries:end -->
```

`fill_placeholders` drops a line when every `{key}` on that line is empty. Always pass `"true"` / `"false"` / `"ordinary"` strings for the three flags so those lines stay.

```python
def read_index_template(
    file_name: str, entry_type: str, description: str, *, flags: dict[str, str] | None = None
) -> str:
    path = template_path(file_name)
    if path.is_file():
        return read_template(file_name)
    flags = flags or {}
    from lib.paths import type_dir_name
    return fill_placeholders(
        read_template("TYPE.md"),
        {
            "NAME": entry_type.upper(),
            "type": entry_type,
            "description": description or entry_type,
            "plural": type_dir_name(entry_type),
            "gitignore": flags.get("gitignore", "false"),
            "writable": flags.get("writable", "true"),
            "format": flags.get("format", "ordinary"),
        },
    )
```

`expected_index_document`: if the path is missing, `existing = read_index_template(...)`.

Privilege comment markers (`TYPE_META_START` / `TYPE_META_END`) are added to `lib/blocks.py` in Task 6; Task 4 may leave the HTML in the template unread.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py TypeTemplateTests -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/references/templates/TYPE.tmpl.md \
        extensions/skills/project-memory-init/scripts/lib/templates.py \
        extensions/skills/project-memory-init/scripts/nodes/entries.py \
        extensions/skills/project-memory-init/scripts/tests/test_layer_types.py
git commit -m "feat(memory): generic TYPE.tmpl.md for user-added Memory Type indexes

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: `add_type` writes LAYOUT artifacts (no privilege flags yet)

**Files:**
- Create: `extensions/skills/project-memory-init/scripts/operations/add_type.py`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_add_type.py` (create)
- Modify: `extensions/skills/project-memory-init/scripts/operations/__init__.py`

**Interfaces:**
- Consumes: `validate_type_name`, `index_file_name`, `upsert_local_type_line`, `type_content_dir`, `type_dir_name`, `read_index_template`, `write_atomic`, `refresh_index`
- Produces:

```python
def add_type(
    target: Path,
    entry_type: str,
    description: str,
    *,
    gitignore: bool = False,
    writable: bool = True,
    format: str = "ordinary",
) -> dict[str, object]:
    ...
```

Return shape (lock this; later tasks only add keys):

```python
{
    "operation": "add-type",
    "targetDir": str(target),
    "type": entry_type,
    "index": ".memory/DOCS.md",
    "contentDir": ".memory/docs",
    "agentsAction": "updated" | "preserved",
    "action": "created" | "preserved",
    "flags": {"gitignore": False, "writable": True, "format": "ordinary"},
}
```

Rules for this task (flags ignored except stored in the entry file if the template already has the comment):

- Target must already have `.memory/` and a managed `AGENTS.md` (same gate as remember). Do not call init.
- Reject seed names via `validate_type_name`.
- Idempotent: same name + same description → `action: preserved`, do not clobber a hand-edited intro **except** the entries block (refresh) and the AGENTS line (upsert).
- Create `.memory/<plural>/` for writable ordinary types.
- Do not write `knowledge/tasks/` even when `entry_type == "tasks"`.
- Do not create `types.json`.

- [ ] **Step 1: Write the failing test**

```python
#!/usr/bin/env python3
"""add-type: LAYOUT artifacts, privileges, example-type smoke helpers."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.types import discover_layer_types  # noqa: E402
from operations.add_type import add_type  # noqa: E402
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


class AddTypeLayoutTests(unittest.TestCase):
    def test_add_type_writes_entry_dir_and_agents_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(result["operation"], "add-type")
            self.assertEqual(result["type"], "docs")
            self.assertEqual(result["index"], ".memory/DOCS.md")
            self.assertEqual(result["contentDir"], ".memory/docs")
            self.assertEqual(result["action"], "created")
            self.assertTrue((target / ".memory" / "DOCS.md").is_file())
            self.assertTrue((target / ".memory" / "docs").is_dir())
            self.assertIn(
                ".memory/DOCS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            self.assertEqual(discover_layer_types(target)["docs"], "DOCS.md")
            self.assertFalse((target / "knowledge" / "tasks").exists())

    def test_add_type_rejects_uninitialized_target(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(ValueError) as ctx:
                add_type(Path(raw), "docs", "nope")
            self.assertIn("init", str(ctx.exception))

    def test_add_type_rejects_seed_name(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            with self.assertRaises(ValueError):
                add_type(target, "user", "should fail")

    def test_add_type_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            again = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(again["action"], "preserved")

    def test_remember_after_add_type(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            remember(
                target,
                "docs",
                "readme_pointer",
                "README is the truth source",
                "docs type holds pointers, not copies of the README",
                "Link the README.\n\n**Why:** no docs bucket.\n\n"
                "**How to apply:** remember --type docs.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertTrue(
                (target / ".memory" / "docs" / "docs_readme_pointer.md").is_file()
            )
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeLayoutTests -v
```

Expected: `ModuleNotFoundError: No module named 'operations.add_type'`.

- [ ] **Step 3: Write minimal implementation**

```python
#!/usr/bin/env python3
"""add-type：在指定记忆目录按 LAYOUT 登记一个 Memory Type。"""

from __future__ import annotations

from pathlib import Path

from lib.paths import (
    AGENTS_FILE_NAME,
    memory_dir,
    relative_or_name,
    type_content_dir,
    write_atomic,
)
from lib.types import (
    index_file_name,
    upsert_local_type_line,
    validate_type_name,
)
from nodes.agents import classify_agents_file
from nodes.entries import refresh_index
from lib.templates import read_index_template  # or whatever name Task 4 used


def add_type(
    target: Path,
    entry_type: str,
    description: str,
    *,
    gitignore: bool = False,
    writable: bool = True,
    format: str = "ordinary",
) -> dict[str, object]:
    name = validate_type_name(entry_type)
    normalized = " ".join((description or "").split())
    if not normalized:
        raise ValueError("add-type 必须提供 --description")
    if format not in {"ordinary", "skills"}:
        raise ValueError("format 只能是 ordinary 或 skills")
    if not memory_dir(target).is_dir() or classify_agents_file(
        target / AGENTS_FILE_NAME
    ) != "managed":
        raise ValueError("目标目录尚未初始化，请先执行 init")

    index_name = index_file_name(name)
    index_path = memory_dir(target) / index_name
    content_dir = type_content_dir(target, name)
    existed = index_path.is_file()
    if not existed:
        write_atomic(
            index_path,
            read_index_template(
                index_name,
                name,
                normalized,
                flags={
                    "gitignore": "true" if gitignore else "false",
                    "writable": "true" if writable else "false",
                    "format": format,
                },
            ),
        )
    if writable:
        content_dir.mkdir(parents=True, exist_ok=True)
    refresh_index(target, name)

    agents_path = target / AGENTS_FILE_NAME
    before = agents_path.read_text(encoding="utf-8")
    after = upsert_local_type_line(before, index_name, normalized)
    if after != before:
        write_atomic(agents_path, after)
        agents_action = "updated"
    else:
        agents_action = "preserved"

    rel_index = index_path.relative_to(target).as_posix()
    rel_dir = content_dir.relative_to(target).as_posix()
    return {
        "operation": "add-type",
        "targetDir": str(target),
        "type": name,
        "index": rel_index,
        "contentDir": rel_dir,
        "agentsAction": agents_action,
        "action": "preserved" if existed else "created",
        "flags": {
            "gitignore": gitignore,
            "writable": writable,
            "format": format,
        },
    }
```

`operations/__init__.py` docstring: `四个操作：init / remember / doctor / add-type。`

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeLayoutTests -v
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/operations/add_type.py \
        extensions/skills/project-memory-init/scripts/operations/__init__.py \
        extensions/skills/project-memory-init/scripts/tests/test_add_type.py
git commit -m "feat(memory): add-type registers a LAYOUT Memory Type on one layer

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 6: Privilege comment + `--gitignore`

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/lib/blocks.py` — `TYPE_META_START` / `TYPE_META_END`
- Modify: `extensions/skills/project-memory-init/scripts/lib/types.py` — parse/render + `layer_type_specs`
- Modify: `extensions/skills/project-memory-init/scripts/operations/add_type.py` — append gitignore patterns
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_add_type.py`

**Interfaces:**
- Consumes: ADR-0003 pattern list (`.memory/USER.md`, `**/.memory/USER.md`, dir + `**/` dir)
- Produces:
  - `TYPE_META_START = "<!-- project-memory-type:start -->"`
  - `TYPE_META_END = "<!-- project-memory-type:end -->"`
  - `parse_type_meta(text: str) -> TypeSpec | None`
  - `ensure_type_gitignore(repo_root: Path, entry_type: str) -> str` — `"updated"` | `"preserved"` | `"skipped-no-git"`
  - `add_type(..., gitignore=True)` calls `ensure_type_gitignore` when a `.git` exists at `resolve_root(target, None)`

This is **not** a JSON registry. The comment lives on the type entry file, the same way entries live in `<!-- project-memory-entries -->`. PROTOCOL still says only `memory_*.md` have YAML frontmatter.

Gitignore implementation (feasible, same as `user`):

```python
def gitignore_patterns(entry_type: str) -> tuple[str, ...]:
    index_name = index_file_name(entry_type)
    plural = type_dir_name(entry_type)
    return (
        f".memory/{index_name}",
        f".memory/{plural}/",
        f"**/.memory/{index_name}",
        f"**/.memory/{plural}/",
    )
```

Find the git root by walking `target` and parents for `.git`. If none: do not fail add-type; set `flags["gitignoreAction"] = "skipped-no-git"` and still write `gitignore: true` in the entry comment so a later clone with a repo root can be fixed by hand or a rerun.

If `.gitignore` exists: append a comment line `# Memory type <name> (project-memory-add-type)` plus any missing patterns. Do not rewrite the `user` block.

Do **not** add a generic “ignore all extra types” rule. Only the type being registered.

- [ ] **Step 1: Write the failing test**

```python
class AddTypeGitignoreTests(unittest.TestCase):
    def test_gitignore_flag_appends_repo_patterns(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            (target / ".git").mkdir()
            (target / ".gitignore").write_text("# keep\n", encoding="utf-8")
            init_memory(target, target, "temp tree")
            add_type(target, "secret", "本层不宜提交的摘录", gitignore=True)
            text = (target / ".gitignore").read_text(encoding="utf-8")
            for pattern in (
                ".memory/SECRET.md",
                ".memory/secrets/",
                "**/.memory/SECRET.md",
                "**/.memory/secrets/",
            ):
                self.assertIn(pattern, text, pattern)
            meta = (target / ".memory" / "SECRET.md").read_text(encoding="utf-8")
            self.assertIn("gitignore: true", meta)

    def test_gitignore_without_git_does_not_fail(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = add_type(target, "secret", "no git root", gitignore=True)
            self.assertEqual(result["flags"]["gitignore"], True)
            self.assertIn(result.get("gitignoreAction"), (None, "skipped-no-git"))
```

Also assert `parse_type_meta` on `SECRET.md` returns `TypeSpec(name="secret", gitignore=True, ...)`.

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeGitignoreTests -v
```

Expected: FAIL — `add_type` does not take `gitignore` seriously yet (or `TypeError`).

- [ ] **Step 3: Write minimal implementation**

```python
TYPE_META_START = "<!-- project-memory-type:start -->"
TYPE_META_END = "<!-- project-memory-type:end -->"


def parse_type_meta(text: str) -> TypeSpec | None:
    match = block_pattern(TYPE_META_START, TYPE_META_END).search(text)
    if match is None:
        return None
    fields: dict[str, str] = {}
    for raw in match.group(0).splitlines():
        key, sep, value = raw.partition(":")
        if sep:
            fields[key.strip()] = value.strip()
    name = fields.get("name", "")
    if not name:
        return None
    return TypeSpec(
        name=name,
        index_file=index_file_name(name),
        description=fields.get("description", ""),
        writable=fields.get("writable", "true") != "false",
        gitignore=fields.get("gitignore", "false") == "true",
        format=fields.get("format", "ordinary"),
    )


def ensure_type_gitignore(repo_root: Path, entry_type: str) -> str:
    gitignore = repo_root / ".gitignore"
    if not (repo_root / ".git").exists():
        return "skipped-no-git"
    existing = gitignore.read_text(encoding="utf-8") if gitignore.is_file() else ""
    missing = [p for p in gitignore_patterns(entry_type) if p not in existing]
    if not missing:
        return "preserved"
    block = "\n".join(
        [
            f"# Memory type {entry_type} (project-memory-add-type)",
            *missing,
        ]
    )
    updated = existing.rstrip() + "\n\n" + block + "\n"
    gitignore.write_text(updated, encoding="utf-8")
    return "updated"
```

`layer_type_specs(target)`: for each `discover_layer_types` name, if the entry file has a type-meta block, use it; else defaults (`user` gitignore True, `agent_skills` writable False + format skills, `skills` format skills).

`layer_writable_types` must honor `spec.writable` once `layer_type_specs` exists (so Task 7 can rely on it).

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeGitignoreTests -v
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py UserGitignoreTests -v
```

Expected: PASS. Existing `user` gitignore patterns stay intact.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/lib/blocks.py \
        extensions/skills/project-memory-init/scripts/lib/types.py \
        extensions/skills/project-memory-init/scripts/operations/add_type.py \
        extensions/skills/project-memory-init/scripts/tests/test_add_type.py
git commit -m "feat(memory): add-type --gitignore appends ADR-0003 style patterns

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 7: `--index-only` (writable=false)

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/operations/add_type.py`
- Modify: `extensions/skills/project-memory-init/scripts/lib/types.py` — `layer_writable_types` uses `TypeSpec.writable`
- Modify: `extensions/skills/project-memory-init/scripts/operations/doctor.py` — skip `missing-type-dir` when `writable` is false (same spirit as `is_external_type`)
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_add_type.py`

**Interfaces:**
- Consumes: `layer_type_specs(target)`
- Produces: index-only types have an entry + AGENTS line, **no** required content dir; `remember(..., entry_type)` raises `ValueError` containing `只索引`; doctor does not emit `missing-type-dir` for them

Do **not** add a new `EXTERNAL_CONTENT_DIRS` row. Index-only user types still live under `.memory/` (entry file). They are “只索引” in the `agent_skills` **write** sense, not the “content root outside `.memory/`” sense. That external-root case is the stub in Task 8.

- [ ] **Step 1: Write the failing test**

```python
from operations.doctor import doctor_memory  # noqa: E402


class AddTypeIndexOnlyTests(unittest.TestCase):
    def test_index_only_has_no_content_dir_and_rejects_remember(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = add_type(
                target,
                "catalog",
                "只索引外部清单，不在这里写条目",
                writable=False,
            )
            self.assertFalse(result["flags"]["writable"])
            self.assertFalse((target / ".memory" / "catalogs").exists())
            self.assertTrue((target / ".memory" / "CATALOG.md").is_file())
            with self.assertRaises(ValueError) as ctx:
                remember(
                    target,
                    "catalog",
                    "nope",
                    "title",
                    "should fail",
                    "body",
                    {},
                )
            self.assertIn("只索引", str(ctx.exception))
            report = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in report["findings"]}
            self.assertNotIn("missing-type-dir", issues)
            self.assertNotIn("outdated-local", issues)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeIndexOnlyTests -v
```

Expected: FAIL — `add_type` still `mkdir`s `catalogs/`, and/or doctor reports `missing-type-dir`, and/or remember succeeds.

- [ ] **Step 3: Write minimal implementation**

- `add_type`: `if writable: content_dir.mkdir(...)` (already in Task 5). Persist `writable: false`.
- `layer_writable_types`: exclude `not spec.writable`.
- `resolve_memory_path` / `memory.py` already reject non-writable names; error text must include `只索引`.
- `scan_memory_layout`: treat a type as skip-missing-dir when `is_external_type(entry_type) or not spec.writable`.

Do not skip `missing-index` — the entry file is still required.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeIndexOnlyTests -v
```

Expected: PASS. A clean init+doctor tree still has zero findings.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/lib/types.py \
        extensions/skills/project-memory-init/scripts/operations/add_type.py \
        extensions/skills/project-memory-init/scripts/operations/doctor.py \
        extensions/skills/project-memory-init/scripts/nodes/entries.py \
        extensions/skills/project-memory-init/scripts/tests/test_add_type.py
git commit -m "feat(memory): add-type --index-only skips writes and missing-type-dir

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 8: `--skills-format` implement; `--external-content-dir` stub

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/nodes/entries.py` — format set is seed ∪ layer specs
- Modify: `extensions/skills/project-memory-init/scripts/operations/add_type.py`
- Modify: `extensions/skills/project-memory-init/scripts/memory.py` — reject `--external-content-dir`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_add_type.py`

**Interfaces:**
- Consumes: existing `AGENT_SKILL_FORMAT_TYPES`, `SKILL.tmpl.md`, kebab-case slug rules
- Produces:
  - `is_skill_format(target: Path, entry_type: str) -> bool`
  - `add_type(..., format="skills")` → remember writes `.memory/<plural>/<slug>/SKILL.md`
  - `add_type` / CLI reject `--external-content-dir` with a fixed error that names the stub

`agent_skills` remains the only `EXTERNAL_CONTENT_DIRS` key. A user type cannot hang its content root on `.agents/skills/` this round.

- [ ] **Step 1: Write the failing test**

```python
class AddTypeSkillsFormatTests(unittest.TestCase):
    def test_skills_format_remember_writes_skill_md(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(
                target,
                "playbook",
                "可执行手册，形态与 skills 相同",
                format="skills",
            )
            result = remember(
                target,
                "playbook",
                "rerun-failed-e2e",
                None,
                "rerun failed e2e once",
                "1. Collect failed tests.\n2. Rerun them.",
                {"username": "tester", "email": "t@example.com"},
            )
            path = target / ".memory" / "playbooks" / "rerun-failed-e2e" / "SKILL.md"
            self.assertTrue(path.is_file(), result)
            self.assertEqual(
                result["path"],
                ".memory/playbooks/rerun-failed-e2e/SKILL.md",
            )


class AddTypeExternalStubTests(unittest.TestCase):
    def test_external_content_dir_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            with self.assertRaises(ValueError) as ctx:
                add_type(
                    target,
                    "plugins",
                    "want external root",
                    external_content_dir=(".agents", "plugins"),
                )
            message = str(ctx.exception)
            self.assertIn("stub", message.lower())
            self.assertIn("agent_skills", message)
            self.assertNotIn("plugins", discover_layer_types(target))
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeSkillsFormatTests AddTypeExternalStubTests -v
```

Expected: FAIL — `resolve_memory_path` uses ordinary `playbook_<slug>.md` because `AGENT_SKILL_FORMAT_TYPES` is still `{skills, agent_skills}`.

- [ ] **Step 3: Write minimal implementation**

```python
def is_skill_format(target: Path, entry_type: str) -> bool:
    if entry_type in AGENT_SKILL_FORMAT_TYPES:
        return True
    for spec in layer_type_specs(target):
        if spec.name == entry_type:
            return spec.format == "skills"
    return False
```

Replace `entry_type in AGENT_SKILL_FORMAT_TYPES` in `resolve_memory_path`, `entry_output_name`, `entry_name`, `build_entry_index`, `build_entry_fields` with `is_skill_format(target, entry_type)` wherever `target` is in scope. `entry_output_name` and `entry_name` need a `target` argument — add it; update call sites (remember already has `target`).

`add_type`:

```python
def add_type(..., external_content_dir: tuple[str, ...] | None = None) -> dict[str, object]:
    if external_content_dir is not None:
        raise ValueError(
            "external content root is stubbed this round; "
            "only official agent_skills may live outside .memory/"
        )
```

In `TYPE.tmpl.md` / playbook entry, `format: skills` changes the “正文写在 `{plural}/{type}_<slug>.md`” sentence. Pass a `{body_hint}` placeholder so the intro stays accurate:

- ordinary: `` `{plural}/{type}_<slug>.md` ``
- skills: `` `{plural}/<name>/SKILL.md` ``

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeSkillsFormatTests AddTypeExternalStubTests -v
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
```

Expected: PASS. Official `skills` / `agent_skills` remember + index paths unchanged.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/nodes/entries.py \
        extensions/skills/project-memory-init/scripts/operations/add_type.py \
        extensions/skills/project-memory-init/scripts/memory.py \
        extensions/skills/project-memory-init/references/templates/TYPE.tmpl.md \
        extensions/skills/project-memory-init/scripts/tests/test_add_type.py
git commit -m "feat(memory): add-type --skills-format; stub external content roots

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 9: Doctor discovers extras and does not wipe them

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/operations/doctor.py`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_add_type.py`

**Interfaces:**
- Consumes: `discover_layer_types(owner)`, `layer_type_specs(owner)`, `ensure_seed_local_lines`
- Produces:
  - `expected_indexes` for a layer = stems of `discover_layer_types(owner)` (not seed-only)
  - `scan_memory_layout` iterates discovered types (seeds ∪ extras)
  - new finding `unregistered-type` when `.memory/FOO.md` has an entries block but AGENTS local has no link; apply inserts the line via `upsert_local_type_line`
  - `apply_findings` must **not** call `sync_agents_blocks(..., local=build_local_block())` or `upsert_block(..., build_local_block())` on a managed layer that already has extras
  - `foreign-agents` still plants **seed** `build_local_block()` (new layer, no extras yet) — that is correct

Today `outdated-local` compares `actual_indexes != expected_indexes` where expected is seed-only. After add-type, doctor would flag the layer and `--apply` would overwrite with six seed links.

- [ ] **Step 1: Write the failing test**

```python
class DoctorDiscoversExtraTypesTests(unittest.TestCase):
    def test_doctor_clean_after_add_type(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            report = doctor_memory(target, apply=False)
            self.assertEqual(report["findings"], [], report)

    def test_doctor_apply_does_not_drop_docs_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            doctor_memory(target, apply=True)
            self.assertIn(
                ".memory/DOCS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            remaining = doctor_memory(target, apply=False)
            self.assertEqual(remaining["findings"], [], remaining)

    def test_unregistered_type_entry_is_linked_on_apply(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            (target / ".memory" / "RESEARCH.md").write_text(
                "# RESEARCH\n\n<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            report = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in report["findings"]}
            self.assertIn("unregistered-type", issues)
            doctor_memory(target, apply=True)
            self.assertIn(
                ".memory/RESEARCH.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py DoctorDiscoversExtraTypesTests -v
```

Expected: FAIL — `test_doctor_clean_after_add_type` sees `outdated-local`. `test_doctor_apply_does_not_drop_docs_line` loses the DOCS line after `--apply`.

- [ ] **Step 3: Write minimal implementation**

In `scan_memory_layout`:

```python
    for owner in memory_dirs:
        discovered = discover_layer_types(owner)
        expected_indexes = [Path(name).stem for name in discovered.values()]
        specs = {spec.name: spec for spec in layer_type_specs(owner)}
        for entry_type, file_name in discovered.items():
            spec = specs.get(entry_type)
            skip_dir = is_external_type(entry_type) or (
                spec is not None and not spec.writable
            )
            # missing-type-dir: only if not skip_dir
            # missing-index / outdated-index: still apply to extras
            ...
        # outdated-local: compare actual AGENTS links to expected_indexes
        # (discovered), not seed_index_files()
```

After the per-type loop, if an expected seed from `seed_index_files()` is missing from `discovered` (someone deleted the USER.md line), still report `outdated-local` — `ensure_seed_local_lines` on apply restores seeds **without** dropping extras.

`unregistered-type` finding:

```python
        actual = MEMORY_INDEX_LINK_PATTERN.findall(match.group(0)) if match else []
        actual_set = {name.lower() for name in actual}
        for entry_type, file_name in discovered.items():
            if entry_type not in actual_set:
                findings.append(
                    {
                        "issue": "unregistered-type",
                        "path": relative_or_name(owner / AGENTS_FILE_NAME, root),
                        "type": entry_type,
                        "entry": f".memory/{file_name}",
                        "detail": "入口文件在，但本层清单没有这一行",
                    }
                )
```

`apply_findings`:

- `unregistered-type`: `upsert_local_type_line` using description from `parse_type_meta` or `"{type} 类型的记忆入口。"`.
- `outdated-local` / `missing-agents`: `ensure_seed_local_lines` then write that block; **never** `build_local_block()` alone on a managed memory dir.
- `foreign-agents`: keep `build_local_block()` (seeds only).
- Refresh indexes: iterate `discover_layer_types(owner)`, not `index_files()`.
- mkdir: skip external + `writable=False`.

Add `unregistered-type` to the doctor SKILL.md table in Task 13 (not here).

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py DoctorDiscoversExtraTypesTests -v
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py -v
```

Expected: PASS. Idempotent: doctor `--apply` then diagnose → zero findings.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/operations/doctor.py \
        extensions/skills/project-memory-init/scripts/tests/test_add_type.py
git commit -m "fix(memory): doctor discovers extra types and will not wipe them

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 10: Example-type smoke (not init seeds)

**Files:**
- Create: `extensions/skills/project-memory-init/scripts/tests/test_example_types_smoke.py`

**Interfaces:**
- Consumes: `add_type`, `remember`, `doctor_memory`, `init_memory`, `seed_index_files`
- Produces: one test module that registers the six ADR example names on a **temp** tree and asserts they never appear in `AGENTS.tmpl.md` / `seed_index_files()`

Locked example names and descriptions (use these strings; do not invent others):

```python
EXAMPLE_TYPES: tuple[tuple[str, str], ...] = (
    ("docs", "项目内文档指针，不是知识库正文"),
    ("progress", "进行中的进度快照，不是可提交决策"),
    ("tasks", "项目记忆里的任务备忘，不是 knowledge/tasks 看板"),
    ("research", "调研笔记指针，不是 reference 外部源头"),
    ("reminder", "提醒与到期事项"),
    ("scheduler", "调度与周期动作"),
)
```

`type_dir_name` consequences (do not special-case):

| name | index | content dir |
| --- | --- | --- |
| `docs` | `DOCS.md` | `docs/` (already ends with s) |
| `progress` | `PROGRESS.md` | `progresses/` |
| `tasks` | `TASKS.md` | `tasks/` (already ends with s) |
| `research` | `RESEARCH.md` | `researches/` |
| `reminder` | `REMINDER.md` | `reminders/` |
| `scheduler` | `SCHEDULER.md` | `schedulers/` |

`tasks` content dir is `target / ".memory" / "tasks"`. The test tree has no `knowledge/` directory; assert it still does not after add-type.

- [ ] **Step 1: Write the failing test**

```python
#!/usr/bin/env python3
"""ADR 0006 example types: smoke only, never official init seeds."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.paths import type_content_dir, type_dir_name  # noqa: E402
from lib.templates import template_path  # noqa: E402
from lib.types import discover_layer_types, seed_index_files  # noqa: E402
from operations.add_type import add_type  # noqa: E402
from operations.doctor import doctor_memory  # noqa: E402
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402

EXAMPLE_TYPES: tuple[tuple[str, str], ...] = (
    ("docs", "项目内文档指针，不是知识库正文"),
    ("progress", "进行中的进度快照，不是可提交决策"),
    ("tasks", "项目记忆里的任务备忘，不是 knowledge/tasks 看板"),
    ("research", "调研笔记指针，不是 reference 外部源头"),
    ("reminder", "提醒与到期事项"),
    ("scheduler", "调度与周期动作"),
)


class ExampleTypesAreNotSeedsTests(unittest.TestCase):
    def test_template_and_seed_map_omit_examples(self) -> None:
        seeds = seed_index_files()
        template = template_path("AGENTS.md").read_text(encoding="utf-8")
        for name, _description in EXAMPLE_TYPES:
            self.assertNotIn(name, seeds)
            self.assertNotIn(f".memory/{name.upper()}.md", template)


class ExampleTypesSmokeTests(unittest.TestCase):
    def test_add_remember_doctor_init_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "example smoke")
            for name, description in EXAMPLE_TYPES:
                add_type(target, name, description)
                self.assertTrue((target / ".memory" / f"{name.upper()}.md").is_file())
                self.assertEqual(
                    type_content_dir(target, name),
                    target / ".memory" / type_dir_name(name),
                )
            self.assertFalse((target / "knowledge").exists())
            self.assertEqual(
                type_content_dir(target, "tasks"),
                target / ".memory" / "tasks",
            )
            remember(
                target,
                "docs",
                "layout_pointer",
                "LAYOUT is the extension surface",
                "example docs type is a pointer slot, not a seed",
                "Use add-type, not AGENTS.tmpl.md.\n\n"
                "**Why:** ADR 0006 smoke only.\n\n"
                "**How to apply:** keep examples out of seeds.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertTrue(
                (target / ".memory" / "docs" / "docs_layout_pointer.md").is_file()
            )
            remember(
                target,
                "tasks",
                "not_the_board",
                "tasks Memory Type is not the board",
                "ordinary memory, not knowledge/tasks status folders",
                "Do not move board files.\n\n**Why:** ADR 0006.\n\n"
                "**How to apply:** write .memory/tasks/ only.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertTrue(
                (target / ".memory" / "tasks" / "tasks_not_the_board.md").is_file()
            )
            self.assertEqual(doctor_memory(target, apply=False)["findings"], [])
            init_memory(target, target, "example smoke")
            agents = (target / "AGENTS.md").read_text(encoding="utf-8")
            for name, _description in EXAMPLE_TYPES:
                self.assertIn(f".memory/{name.upper()}.md", agents)
                self.assertIn(name, discover_layer_types(target))
            self.assertEqual(doctor_memory(target, apply=True)["remaining"], [])
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_example_types_smoke.py -v
```

Expected: FAIL only if earlier tasks are incomplete. If Tasks 1–9 already pass, this test should pass on first run — that is acceptable; do not weaken it. If `progresses/` surprises you, that is the existing `type_dir_name` contract — keep it.

- [ ] **Step 3: Write minimal implementation**

No production code if Tasks 1–9 are done. If the smoke fails, fix the underlying function; do not special-case example names in `validate_type_name` or `AGENTS.tmpl.md`.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_example_types_smoke.py -v
```

Expected: PASS. `test_template_and_seed_map_omit_examples` is the seed-inflation guard.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/tests/test_example_types_smoke.py
git commit -m "test(memory): smoke ADR 0006 example types without seeding them

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 11: `memory.py add-type` CLI

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/memory.py`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_add_type.py`
- Modify: `extensions/skills/project-memory-init/scripts/OVERVIEW.md`

**Interfaces:**
- Consumes: `add_type(...)`
- Produces: `python3 memory.py add-type --target-dir DIR --name NAME --description TEXT [--gitignore] [--index-only] [--skills-format] [--external-content-dir PATH]`

`--external-content-dir` is accepted only so the stub error is reachable from the CLI (same JSON `ok: false` envelope as other operations). Do not implement the path.

JSON success uses the Task 5 return dict plus `ok: true`.

- [ ] **Step 1: Write the failing test**

```python
import json
import subprocess

MEMORY_PY = SCRIPTS / "memory.py"


class AddTypeCliTests(unittest.TestCase):
    def test_cli_add_type_then_remember(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "init",
                    "--target-dir",
                    str(target),
                    "--root-dir",
                    str(target),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(init.returncode, 0, init.stderr)
            added = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "add-type",
                    "--target-dir",
                    str(target),
                    "--name",
                    "docs",
                    "--description",
                    "项目内文档指针，不是知识库正文",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(added.returncode, 0, added.stderr)
            payload = json.loads(added.stdout)
            self.assertTrue(payload["ok"])
            self.assertEqual(payload["type"], "docs")
            remember_cli = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "remember",
                    "--target-dir",
                    str(target),
                    "--type",
                    "docs",
                    "--slug",
                    "cli_docs",
                    "--title",
                    "CLI docs",
                    "--description",
                    "created from add-type CLI",
                    "--username",
                    "tester",
                    "--email",
                    "t@example.com",
                    "--content",
                    "CLI body.\n\n**Why:** wire the subcommand.\n\n"
                    "**How to apply:** skill calls this.",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(remember_cli.returncode, 0, remember_cli.stderr)

    def test_cli_external_content_dir_returns_json_error(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "init",
                    "--target-dir",
                    str(target),
                    "--root-dir",
                    str(target),
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            stubbed = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "add-type",
                    "--target-dir",
                    str(target),
                    "--name",
                    "plugins",
                    "--description",
                    "external stub",
                    "--external-content-dir",
                    ".agents/plugins",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(stubbed.returncode, 1)
            payload = json.loads(stubbed.stdout)
            self.assertFalse(payload["ok"])
            self.assertIn("stub", payload["error"].lower())
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeCliTests -v
```

Expected: FAIL — argparse: `invalid choice: 'add-type'`.

- [ ] **Step 3: Write minimal implementation**

```python
    add_parser = subparsers.add_parser("add-type")
    add_parser.add_argument("--target-dir", required=True, help="已 init 的记忆目录")
    add_parser.add_argument("--name", required=True, help="小写 snake_case 类型名，不能是官方种子")
    add_parser.add_argument("--description", required=True, help="写进 AGENTS 本层清单的那句说明")
    add_parser.add_argument(
        "--gitignore",
        action="store_true",
        help="按 ADR-0003 风格把入口与复数目录写入仓库根 .gitignore",
    )
    add_parser.add_argument(
        "--index-only",
        action="store_true",
        help="只索引不写（remember 拒绝；doctor 不报 missing-type-dir）",
    )
    add_parser.add_argument(
        "--skills-format",
        action="store_true",
        help="条目形态与 skills 相同：<name>/SKILL.md，slug 用 kebab-case",
    )
    add_parser.add_argument(
        "--external-content-dir",
        help="本轮 stub：传入即 JSON 错误。只有官方 agent_skills 能把内容根放在 .memory/ 外",
    )
```

Dispatch:

```python
        elif arguments.operation == "add-type":
            result = add_type(
                target,
                arguments.name,
                arguments.description,
                gitignore=arguments.gitignore,
                writable=not arguments.index_only,
                format="skills" if arguments.skills_format else "ordinary",
                external_content_dir=(
                    tuple(Path(arguments.external_content_dir).parts)
                    if arguments.external_content_dir
                    else None
                ),
            )
```

OVERVIEW.md: change “三个子命令” to four; add a table row “在指定层登记用户 type → `add-type`”; replace “加一个普通记忆类型：在 AGENTS.tmpl.md 加一行” with “官方种子仍改模板；用户 type 走 `add-type`，由本层 AGENTS / 入口产物发现”.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py AddTypeCliTests -v
python3 extensions/skills/project-memory-init/scripts/memory.py add-type --help
```

Expected: PASS. `--help` lists `--gitignore` / `--index-only` / `--skills-format` / `--external-content-dir`.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/memory.py \
        extensions/skills/project-memory-init/scripts/OVERVIEW.md \
        extensions/skills/project-memory-init/scripts/tests/test_add_type.py
git commit -m "feat(memory): expose add-type on memory.py

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 12: LAYOUT + seed heading (PROTOCOL untouched)

**Files:**
- Modify: `extensions/skills/project-memory-init/references/LAYOUT.md`
- Modify: `extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_layer_types.py`

**Interfaces:**
- Consumes: ADR 0006 “扩展面 = 只改 LAYOUT”
- Produces: LAYOUT documents discovery, privilege comment, add-type, seed vs example; `AGENTS.tmpl.md` heading becomes count-free 「下面这些是索引，不是正文」

PROTOCOL.md: **zero type names added**. If you open it, the only allowed edit is none. The existing sentence “有哪些 type 属于实现” already covers extras.

- [ ] **Step 1: Write the failing test**

```python
class LayoutHeadingTests(unittest.TestCase):
    def test_agents_template_heading_has_no_count(self) -> None:
        text = template_path("AGENTS.md").read_text(encoding="utf-8")
        self.assertIn("下面这些是索引，不是正文", text)
        self.assertNotIn("下面六个", text)
        self.assertNotIn(".memory/DOCS.md", text)
        self.assertNotIn(".memory/TASKS.md", text)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py LayoutHeadingTests -v
```

Expected: FAIL — template still says 「下面六个」.

- [ ] **Step 3: Write minimal implementation**

In `AGENTS.tmpl.md` replace the heading line only:

```markdown
下面这些是索引，不是正文。按条目说明挑要读的，再打开对应内容。
```

Keep the six seed links. Do not add example links.

LAYOUT.md edits (exact sections):

1. After the opening “可以自由升级…” paragraph, add:

```markdown
**扩展一个 Memory Type（ADR 0006）：** 只改本文件描述的产物——该层 `.memory/<TYPE>.md` 入口、`.memory/<plural>/` 内容目录、以及 `AGENTS.md` 本层清单一行。用 `$project-memory-add-type`（`memory.py add-type`）登记。**不要**另写 JSON/YAML 类型注册表。PROTOCOL 不枚举类型。官方 init 种子仍是下表六类；`docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler` 只作文档与测试冒烟，不进种子。
```

2. Change 「本实现取六类」to 「官方 init 种子是六类；本层还可以有用户登记的 type，发现顺序以本层 `AGENTS.md` 清单为准，并并上已有的 `.memory/<TYPE>.md` 入口产物」.

3. Document the privilege comment (`<!-- project-memory-type -->`) and the three implemented flags (`gitignore`, `writable`/`index-only`, `format=skills`). Document the stub: content root outside `.memory/` remains `agent_skills` only.

4. Add a row to the type table **footnote** (not a seventh seed row):

```markdown
用户后加的 type 与普通种子同构：`--name docs` → 入口 `DOCS.md`、目录 `docs/`、条目前缀 `docs_`。`tasks` Memory Type 的目录是 `.memory/tasks/`，与 `knowledge/tasks/` 看板不是同一套文件。
```

5. Change 「本层记忆区块的每一行就是一个类型声明，脚本从中推导」to: 种子仍从 `AGENTS.tmpl.md` 推导；**运行时** remember / doctor / ask 从该层 AGENTS / 入口产物发现。

Do not list example types as official table rows.

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py LayoutHeadingTests ExampleTypesAreNotSeedsTests -v
```

Expected: PASS. `PROTOCOL.md` git diff is empty:

```bash
git diff -- extensions/skills/project-memory-init/references/PROTOCOL.md
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/references/LAYOUT.md \
        extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md \
        extensions/skills/project-memory-init/scripts/tests/test_layer_types.py
git commit -m "docs(memory): LAYOUT-only Memory Type extension; count-free local heading

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 13: Skills (init → add-type / remember / ask / reshape → doctor)

**Files:**
- Create: `extensions/skills/project-memory-add-type/SKILL.md`
- Create: `extensions/skills/project-memory-add-type/CHANGELOG.md`
- Modify: `extensions/skills/project-memory-init/SKILL.md` + `CHANGELOG.md`
- Modify: `extensions/skills/project-memory-remember/SKILL.md` + `CHANGELOG.md`
- Modify: `extensions/skills/project-memory-ask/SKILL.md` + `CHANGELOG.md`
- Modify: `extensions/skills/project-memory-reshape/SKILL.md` + `CHANGELOG.md`
- Modify: `extensions/skills/project-memory-doctor/SKILL.md` + `CHANGELOG.md`
- Modify: `CHANGELOG.md` (root Unreleased)

**Interfaces:**
- Consumes: `memory.py add-type` contract from Task 11
- Produces: thin `$project-memory-add-type` skill (like remember/doctor: no private scripts); sibling skills describe discovery; `pnpm skills:link` symlink

Capability Surface sentence to use wherever a skill mentions how this is exposed (copy verbatim):

> 能力面仍是 CLI + Skill + MCP 三者并列。本轮动作是 Skill（`$project-memory-add-type`）加当前 Python `memory.py`；迁到 `edges` CLI 以及其后的 MCP 对齐见 backlog，不在本轮、也不用来推迟特权 flag。

- [ ] **Step 1: Write the skill files (no extra test harness)**

`extensions/skills/project-memory-add-type/SKILL.md`:

```markdown
---
name: project-memory-add-type
description: 在指定记忆目录按 LAYOUT 登记一个 Memory Type（入口文件 + 复数目录 + AGENTS 本层一行）。仅当用户明确要求新增 type 时使用。官方种子仍是六类；不要把示例 type 写进 init 模板。
version: 1.0.0
---

# Project Memory Add Type

在**已经 init** 的记忆目录登记一个用户 Memory Type。扩展面只在 LAYOUT：`.memory/<TYPE>.md` + `.memory/<plural>/` + 该层 `AGENTS.md` 本层清单一行。不写 JSON/YAML 注册表。PROTOCOL 不枚举类型。

下文的 `<init-dir>` 指同级的 `project-memory-init` skill 目录。

## 什么时候用

- 用户明确要求「给这一层加一个 type / 登记一个 Memory Type」。
- 不要在 remember / ask / doctor / init 里代为调用。
- 不要把 `docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler` 写进 `AGENTS.tmpl.md`。它们只是示例名，用户要才登记。
- `tasks` Memory Type ≠ `knowledge/tasks` 看板。看板状态夹本 skill 碰都不能碰。

## 步骤

1. 确认目标目录已经 `$project-memory-init`（有 `.memory/` 与本套 `AGENTS.md`）。没有就停，先问用户要不要 Init。
2. 要 `--name`（小写 snake_case，不能是 `user` / `feedback` / `project` / `reference` / `skills` / `agent_skills`）和一句 `--description`（写进本层清单，供 ask 挑选）。
3. 特权 flag 只在用户点名时加：
   - `--gitignore`：按用户记忆 / ADR-0003 把入口与复数目录追加进仓库根 `.gitignore`（含 `**/` 下层）。
   - `--index-only`：只索引，remember 拒绝写入。
   - `--skills-format`：条目形态与 `skills` 相同。
   - `--external-content-dir`：本轮 stub，脚本会 JSON 失败；不要绕过它去改 `EXTERNAL_CONTENT_DIRS`。
4. 执行：

   ```bash
   python3 <init-dir>/scripts/memory.py add-type \
     --target-dir <目录> \
     --name <type> \
     --description <一句说明> \
     [--gitignore] [--index-only] [--skills-format]
   ```

5. 按返回 JSON 汇报 `type` / `index` / `contentDir` / `action`。然后用 `$project-memory-remember --type <name>` 写一条冒烟，或告诉用户可以开始写。

## 规则

- 能力面仍是 CLI + Skill + MCP 三者并列。本轮动作是 Skill（`$project-memory-add-type`）加当前 Python `memory.py`；迁到 `edges` CLI 以及其后的 MCP 对齐见 backlog，不在本轮、也不用来推迟特权 flag。
- 改 LAYOUT 与当前脚本；不要等 edges CLI，也不要先做类型总配置。
- 官方 init 种子不因示例膨胀。
```

`CHANGELOG.md` for the new skill: Keep a Changelog, `## [Unreleased]` empty, `## [1.0.0] - YYYY-MM-DD` Added the skill + ADR 0006 pointer.

Init SKILL.md: one paragraph that extra types are **not** created by init; point to `$project-memory-add-type`. Bump version 1.7.0 → 1.8.0 in frontmatter when you cut the skill release; until then put the note under that skill’s `[Unreleased]`.

Remember SKILL.md: `--type` is “该层已登记的可写类型（种子 + AGENTS 本层额外行）”; `agent_skills` still not writable; do not list only five/six names as a closed CLI set. `[Unreleased]` Changed.

Ask SKILL.md: after “按你实际读到的内容走”, add: 本层清单里多出来的入口就是用户登记的 Memory Type，与种子同一跳规则；不要假定只有六份。`[Unreleased]` Changed.

Reshape SKILL.md: extract table stays the six built-ins; add a footnote: 该层 AGENTS.md 已列出的额外 type 也可以作为 remember `--type`。`[Unreleased]` Changed.

Doctor SKILL.md (last): add `unregistered-type` to the issue table; change `outdated-local` text from “与当前布局不一致” to “与**该层已发现**的 type 清单不一致（种子 ∪ 用户登记），apply 不得删掉额外行”; say `.agents/` still untouched. `[Unreleased]` Changed.

Root `CHANGELOG.md` `[Unreleased]` Added:

```markdown
- `$project-memory-add-type`：按 LAYOUT 在指定记忆目录登记用户 Memory Type；remember / ask / doctor 从该层产物发现。官方种子仍是六类（ADR-0006）。
```

Do not bump the repo `package.json` version.

- [ ] **Step 2: Link the skill**

```bash
pnpm skills:link
pnpm skills:link -- --check
```

Expected: `.agents/skills/project-memory-add-type` is a relative symlink to `extensions/skills/project-memory-add-type`.

- [ ] **Step 3: Commit**

```bash
git add extensions/skills/project-memory-add-type \
        extensions/skills/project-memory-init/SKILL.md \
        extensions/skills/project-memory-init/CHANGELOG.md \
        extensions/skills/project-memory-remember/SKILL.md \
        extensions/skills/project-memory-remember/CHANGELOG.md \
        extensions/skills/project-memory-ask/SKILL.md \
        extensions/skills/project-memory-ask/CHANGELOG.md \
        extensions/skills/project-memory-reshape/SKILL.md \
        extensions/skills/project-memory-reshape/CHANGELOG.md \
        extensions/skills/project-memory-doctor/SKILL.md \
        extensions/skills/project-memory-doctor/CHANGELOG.md \
        CHANGELOG.md \
        .agents/skills/project-memory-add-type
git commit -m "feat(memory): ship project-memory-add-type skill and sibling copy

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 14: Full regression + ADR 0006 self-check

**Files:** none new. Fix only if a test fails.

- [ ] **Step 1: Run the whole script test suite**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_layer_types.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_add_type.py -v
python3 extensions/skills/project-memory-init/scripts/tests/test_example_types_smoke.py -v
pnpm skills:link -- --check
git diff -- extensions/skills/project-memory-init/references/PROTOCOL.md
```

Expected: all tests PASS; skills:link check clean; PROTOCOL diff empty.

- [ ] **Step 2: Seed inflation grep**

```bash
rg -n "docs/progress/tasks/research/reminder/scheduler|\.memory/DOCS.md|\.memory/TASKS.md" \
  extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md
```

Expected: no matches. Examples live only in `test_example_types_smoke.py` and LAYOUT prose (not the seed table).

- [ ] **Step 3: If anything fails, fix and re-run. Do not weaken tests.**

- [ ] **Step 4: Commit any fixes. Open/update the implementation PR. Title/body reference ADR 0006. State: no JSON registry; example types not seeds; `tasks` Memory Type ≠ board; privilege flags in current Python; `edges` CLI / MCP and board merge left on the existing backlogs.**

---

## Spec coverage (self-review)

| ADR 0006 / locked decision | Task |
| --- | --- |
| 扩展面只改 LAYOUT（入口 + `<plural>/` + AGENTS 本层行） | 5, 12 |
| 无 JSON/YAML 类型注册表 | File map, 5, 12; privilege comment is on the entry file |
| PROTOCOL 不枚举具体类型 | 12 (`git diff PROTOCOL.md` empty) |
| 新 skill `$project-memory-add-type` under `extensions/skills/` | 13 |
| 官方 init 种子仍是六类 | 1, 10, 12 |
| 用户 type 与种子同构 | 3, 5, 10 |
| remember / ask / doctor 从该层 AGENTS / 入口产物发现 | 1, 3, 9, 13 |
| 允许对现有脚本做最小改动 | 2, 3, 9 |
| 特权 metadata：gitignore 如用户记忆 | 6（ADR-0003 四条 pattern） |
| 特权：只索引如 `agent_skills` | 7（writable=false；不扩 EXTERNAL_CONTENT_DIRS） |
| 特权：skills 形态 | 8 |
| 过重则 stub 并注明 | 8 `--external-content-dir` |
| 不要卡在 edges CLI | Global Constraints, 11, 13 |
| 示例六名只供文档与测试冒烟 | 10, 12 |
| `tasks` Memory Type ≠ `knowledge/tasks` | 5, 10, 13 |
| 能力面 CLI + Skill + MCP；本轮动作是 Skill | 13 |
| 脚本迁 CLI / 看板合并 = backlog | File map, 13, Task 14 PR body |
| 不改看板状态 | Global Constraints |
| 本计划 PR 不实现 skill | this file only |

## Placeholder scan

No TBD / implement-later / “similar to Task N” without code. Privilege stub is an implemented `ValueError`, not an open design hole.

## Type consistency

- `TypeSpec(name, index_file, description, writable, gitignore, format)`
- `format` is `"ordinary"` | `"skills"` only
- `seed_index_files()` == `index_files()` == six built-ins
- `discover_layer_types(target) -> dict[str, str]`
- `layer_writable_types(target) -> tuple[str, ...]`
- `index_file_name("docs") == "DOCS.md"`
- `add_type(target, entry_type, description, *, gitignore=False, writable=True, format="ordinary", external_content_dir=None) -> dict`
- CLI flags: `--name` / `--description` / `--gitignore` / `--index-only` / `--skills-format` / `--external-content-dir`
- `--index-only` ⇒ `writable=False`
- `--skills-format` ⇒ `format="skills"`
- Doctor issue id: `unregistered-type`
- Example tuple name: `EXAMPLE_TYPES`
- Skill name: `project-memory-add-type`
- Scripts stay in `project-memory-init/scripts/` (shared home). New skill has no `scripts/` of its own.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-13-extensible-project-memory-types.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks. REQUIRED SUB-SKILL: superpowers:subagent-driven-development.
2. **Inline Execution** — execute in one session with executing-plans checkpoints. REQUIRED SUB-SKILL: superpowers:executing-plans.

Do not implement `$project-memory-add-type` in the plan-only PR.
