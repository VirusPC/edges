# User Memory Safe Gitignore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire writable project-memory type `user` end-to-end (template → init → remember → index), gitignore `.memory/users/` plus `.memory/USER.md` plus default backup archives, and ship backup/restore skills so a deleted clone can be reinjected.

**Architecture:** Types are derived from `AGENTS.tmpl.md` local-memory links via `lib/blocks.py` `index_files()`. Adding one link plus `USER.tmpl.md` makes `memory_entry_types()` include `user`, init create `.memory/USER.md` + `.memory/users/`, and remember write `users/user_<slug>.md` then refresh `USER.md`. `type_dir_name("user")` already yields `users`. SoT stays in-repo and gitignored. Escape hatch is two Edges skills under `extensions/skills/` that pack/unpack `USER.md` and `users/` into `user-memory-backup-<timestamp>.tar.gz`. No `private` frontmatter field (deferred; see backlog task「记忆条目加 private 元数据」).

**Tech Stack:** Python 3 stdlib (`unittest`, `tarfile`, `argparse`, `pathlib`), existing `scripts/memory.py` CLI, Agent Skills frontmatter + Keep a Changelog.

**Spec:** `docs/adr/0003-user-memory-in-repo-gitignored.md` (ADR-0003). Glossary: `CONTEXT.md` term 用户记忆（User Memory）. Prior type-set note: `extensions/skills/project-memory-init/.memory/projects/project_type_set.md`. Confirmed after ADR Open: also ignore `.memory/USER.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Do **not** change `knowledge/tasks` board status
- Do **not** implement `private` metadata, per-entry gitignore, or protocol changes for privacy flags
- Do **not** commit actual user content; `USER.md` / `users/` stay gitignored
- Do **not** auto-create/edit `knowledge/posts/`
- v1: no desensitized promotion into committable types
- Backup/restore live in `extensions/skills/` (Edges-related), not `shared-extensions/`
- Default archive at repo root: `user-memory-backup-<timestamp>.tar.gz` (zip glob already ignored; v1 writes tar.gz)
- Init only when user-requested; this PR may run init on existing memory dirs to refresh indexes after the template change
- `PROTOCOL.md` stays frozen (types are implementation); update `LAYOUT.md`

---

## File map

**Create**

- `extensions/skills/project-memory-init/references/templates/USER.tmpl.md`
- `extensions/skills/project-memory-init/scripts/tests/test_user_type.py`
- `extensions/skills/user-memory-backup/SKILL.md`
- `extensions/skills/user-memory-backup/CHANGELOG.md`
- `extensions/skills/user-memory-backup/scripts/backup.py`
- `extensions/skills/user-memory-restore/SKILL.md`
- `extensions/skills/user-memory-restore/CHANGELOG.md`
- `extensions/skills/user-memory-restore/scripts/restore.py`
- `extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py`

**Modify**

- `extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md` — add `.memory/USER.md` link; change 「下面五个」→「下面六个」
- `.gitignore` — add `.memory/USER.md`
- `docs/adr/0003-user-memory-in-repo-gitignored.md` — close Open (USER.md is ignored)
- `extensions/skills/project-memory-init/references/LAYOUT.md` — add `user` row; drop 「官方第四类 user 不落盘」
- `extensions/skills/project-memory-init/SKILL.md` + `CHANGELOG.md` + `scripts/OVERVIEW.md` + `scripts/memory.py` help
- `extensions/skills/project-memory-remember/SKILL.md` + `CHANGELOG.md` — carve out `--type user`
- `extensions/skills/project-memory-reshape/SKILL.md` — add `user` to the extract table
- Existing `AGENTS.md` local blocks (root, `extensions/`, `project-memory-init/`, and other memory dirs) — refresh via init so they list `USER.md`
- `extensions/skills/project-memory-init/.memory/projects/project_type_set.md` — via remember: skill wiring is done
- `.agents/skills/user-memory-backup` and `user-memory-restore` — relative symlinks via `pnpm skills:link`

**Do not create/commit**

- `.memory/USER.md` or `.memory/users/**` (gitignore)
- Any `private` field
- Task board status moves

---

### Task 1: Register `user` in templates (index_files / memory_entry_types)

**Files:**
- Create: `extensions/skills/project-memory-init/scripts/tests/test_user_type.py`
- Create: `extensions/skills/project-memory-init/references/templates/USER.tmpl.md`
- Modify: `extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md`

**Interfaces:**
- Consumes: `lib.blocks.index_files() -> dict[str, str]`, `nodes.entries.memory_entry_types() -> tuple[str, ...]`
- Produces: `index_files()["user"] == "USER.md"`; `"user"` in `memory_entry_types()`

- [ ] **Step 1: Write the failing test**

Add `test_user_type.py` with:

```python
#!/usr/bin/env python3
"""User memory type: registration, paths, init, remember, gitignore."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.blocks import index_files  # noqa: E402
from lib.paths import type_content_dir, type_dir_name  # noqa: E402
from nodes.entries import memory_entry_types  # noqa: E402
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


class UserTypeRegistrationTests(unittest.TestCase):
    def test_index_files_includes_user(self) -> None:
        files = index_files()
        self.assertEqual(files["user"], "USER.md")

    def test_memory_entry_types_includes_user(self) -> None:
        self.assertIn("user", memory_entry_types())

    def test_type_dir_name_user_is_users(self) -> None:
        self.assertEqual(type_dir_name("user"), "users")

    def test_type_content_dir_is_memory_users(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            self.assertEqual(
                type_content_dir(target, "user"),
                target / ".memory" / "users",
            )
```

`test_type_dir_name_user_is_users` and `test_type_content_dir_is_memory_users` already pass on current `paths.py` (document existing contract). The first two must fail until the template link exists.

- [ ] **Step 2: Run test to verify it fails**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py -v
```

Expected: `test_index_files_includes_user` FAIL (`KeyError: 'user'` or assertion). `test_memory_entry_types_includes_user` FAIL.

- [ ] **Step 3: Write minimal implementation**

In `AGENTS.tmpl.md`, change 「下面五个」to 「下面六个」and add this link after `PROJECT.md` (keep AGENT_SKILLS last):

```markdown
- [.memory/USER.md](.memory/USER.md) — 绑定本仓库、不宜公开的个人材料（个人偏好、凭据与密钥）。本机文件，不进 git。
```

Create `USER.tmpl.md` mirroring `FEEDBACK.tmpl.md` / `PROJECT.tmpl.md`:

```markdown
# USER — 用户记忆

> 记：绑定到本仓库、且不宜公开的个人材料——个人偏好（不是项目共享约定）、凭据与密钥、以及其他不得公开的上下文。
> 不记：项目共享约定（走 `project` / `feedback`）、可提交的团队知识。v1 不做脱敏晋升到可提交类型。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。
> **本入口与 `users/` 被 gitignore，绝不提交。** Agent 读的是本机这份 `USER.md`；克隆里默认没有它。换机或删仓前用 `$user-memory-backup`，回注用 `$user-memory-restore`。
> 本文件只是索引，条目区块由脚本重算，正文写在 `users/user_<slug>.md` 里。

<!-- project-memory-entries:start -->
- 暂无条目。
<!-- project-memory-entries:end -->
```

- [ ] **Step 4: Run test to verify it passes**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py UserTypeRegistrationTests -v
```

Expected: PASS (4 tests). Existing `test_frontmatter.py` must still pass:

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_frontmatter.py -v
```

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/tests/test_user_type.py \
        extensions/skills/project-memory-init/references/templates/AGENTS.tmpl.md \
        extensions/skills/project-memory-init/references/templates/USER.tmpl.md
git commit -m "feat(memory): register writable user type in templates

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: Init creates USER.md + users/

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_user_type.py`
- Implementation already in `operations/init.py` once templates drive `index_files()`

**Interfaces:**
- Consumes: `init_memory(target: Path, root: Path, description: str | None) -> dict`
- Produces: `.memory/USER.md` from `USER.tmpl.md`; `.memory/users/` directory

- [ ] **Step 1: Write the failing test** (append to `test_user_type.py`)

```python
class UserInitTests(unittest.TestCase):
    def test_init_creates_user_index_and_dir(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            result = init_memory(target, target, "temp tree")
            user_index = target / ".memory" / "USER.md"
            users_dir = target / ".memory" / "users"
            self.assertTrue(user_index.is_file(), result)
            self.assertTrue(users_dir.is_dir(), result)
            text = user_index.read_text(encoding="utf-8")
            self.assertIn("project-memory-entries:start", text)
            self.assertIn(".memory/USER.md", (target / "AGENTS.md").read_text(encoding="utf-8"))
```

If Task 1 templates are already in, this should pass immediately. If it fails, fix init (it must `read_template("USER.md")` via `index_files().values()` and `type_content_dir(...).mkdir`).

- [ ] **Step 2: Run the test**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py UserInitTests -v
```

Expected: PASS. If FAIL because template missing, that is a Task 1 gap — do not special-case `user` in `init.py`.

- [ ] **Step 3: Commit only if the test file gained this class after Task 1 commit**

```bash
git add extensions/skills/project-memory-init/scripts/tests/test_user_type.py
git commit -m "test(memory): init creates USER.md and users/

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: remember --type user writes users/user_*.md and refreshes USER.md

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_user_type.py`
- Modify: `extensions/skills/project-memory-init/scripts/memory.py` (help text only)
- Implementation already in `remember()` / `resolve_memory_path()` once `user` is a writable type

**Interfaces:**
- Consumes: `remember(target, "user", slug, title, description, content, overrides) -> dict`
- Produces: `.memory/users/user_<slug>.md`; `.memory/USER.md` entries block lists the new row

- [ ] **Step 1: Write the failing test**

```python
class UserRememberTests(unittest.TestCase):
    def test_remember_user_writes_entry_and_refreshes_index(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = remember(
                target,
                "user",
                "local_editor",
                "Prefer helix for git commits",
                "personal editor preference for this repo, not a team convention",
                "Use helix for interactive rebase in this clone.\n\n"
                "**Why:** personal muscle memory.\n\n"
                "**How to apply:** do not write this into project memory.",
                {"username": "tester", "email": "t@example.com"},
            )
            path = target / ".memory" / "users" / "user_local_editor.md"
            self.assertTrue(path.is_file(), result)
            self.assertEqual(result["path"], ".memory/users/user_local_editor.md")
            self.assertEqual(result["index"], ".memory/USER.md")
            index = (target / ".memory" / "USER.md").read_text(encoding="utf-8")
            self.assertIn("user_local_editor.md", index)
            self.assertIn("personal editor preference", index)
```

- [ ] **Step 2: Run test**

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_user_type.py UserRememberTests -v
```

Expected: PASS after Task 1. If `--type` CLI rejects `user`, `memory_entry_types()` is wrong.

- [ ] **Step 3: Update CLI help** in `scripts/memory.py` `remember --type` help string to include `user=本仓不宜公开的个人材料（gitignore，不进 git）`.

- [ ] **Step 4: Commit**

```bash
git add extensions/skills/project-memory-init/scripts/tests/test_user_type.py \
        extensions/skills/project-memory-init/scripts/memory.py
git commit -m "feat(memory): remember --type user writes users/ and USER.md

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: Gitignore `.memory/USER.md` and assert patterns

**Files:**
- Modify: `.gitignore`
- Modify: `docs/adr/0003-user-memory-in-repo-gitignored.md`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_user_type.py`

**Interfaces:**
- Produces: root `.gitignore` contains exactly these user-memory patterns (already has users/ + backup globs):
  - `.memory/users/`
  - `.memory/USER.md`
  - `user-memory-backup-*.tar.gz`
  - `user-memory-backup-*.zip`

- [ ] **Step 1: Write the failing test**

```python
class UserGitignoreTests(unittest.TestCase):
    def test_root_gitignore_covers_user_memory(self) -> None:
        root = Path(__file__).resolve()
        gitignore = None
        for candidate in (root, *root.parents):
            probe = candidate / ".gitignore"
            if probe.is_file() and (candidate / "docs" / "adr").is_dir():
                gitignore = probe
                break
        self.assertIsNotNone(gitignore)
        text = gitignore.read_text(encoding="utf-8")
        for pattern in (
            ".memory/users/",
            ".memory/USER.md",
            "user-memory-backup-*.tar.gz",
            "user-memory-backup-*.zip",
        ):
            self.assertIn(pattern, text, pattern)
```

- [ ] **Step 2: Run to verify it fails**

Expected: FAIL on `.memory/USER.md` (present on main for the other three).

- [ ] **Step 3: Add `.memory/USER.md` under the existing ADR-0003 comment in root `.gitignore`.** Close ADR Open: replace the Open section with a short Decision addendum that implementation ignores `.memory/USER.md` as well (confirmed after the Open note). Mention the glob in the Decision paragraph.

- [ ] **Step 4: Re-run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add .gitignore docs/adr/0003-user-memory-in-repo-gitignored.md \
        extensions/skills/project-memory-init/scripts/tests/test_user_type.py
git commit -m "fix: gitignore .memory/USER.md (ADR-0003 Open)

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: Remember / LAYOUT / init / reshape docs (no hardcoded frozen type list elsewhere)

**Files:**
- Modify: `extensions/skills/project-memory-remember/SKILL.md` + `CHANGELOG.md` (bump to 1.6.0)
- Modify: `extensions/skills/project-memory-init/SKILL.md` + `CHANGELOG.md` (bump to 1.7.0) + `scripts/OVERVIEW.md`
- Modify: `extensions/skills/project-memory-init/references/LAYOUT.md`
- Modify: `extensions/skills/project-memory-reshape/SKILL.md` + `CHANGELOG.md` (bump to 1.3.1)

**Interfaces:**
- Produces: `--type user` is the only remember path that accepts personal prefs and secrets; other types still forbid secrets. LAYOUT lists `user` as a writable in-repo gitignored type.

- [ ] **Step 1: Remember gate**

In `project-memory-remember/SKILL.md`:

- Opening sentence today says writes are permanent in git. Qualify: committable types are permanent in git; `--type user` is gitignored.
- Split the forbid list: temporary chatter / common knowledge still never written. **Personal prefs and secrets** move to `--type user` only. Other types still forbid secrets and non-project personal prefs.
- Add a `### user：本仓不宜公开的个人材料` section: layout `users/user_<slug>.md` + `USER.md`; never `git add` those paths; v1 no promotion; backup/restore skills for escape.

- [ ] **Step 2: LAYOUT**

Replace 「官方第四类 `user` 不落盘」and 「本实现取五类」with six types. Add table row:

| `user` | `USER.md` | `users/user_<slug>.md` | 是 | 本仓个人偏好、凭据与不得公开材料；整类 gitignore |

Note that `.memory/USER.md` and `.memory/users/` do not enter git. Keep `agent_skills` as the only external content root.

Fix stale 「本层四份」in the local-block table to 「本层分类型入口」.

- [ ] **Step 3: init SKILL / OVERVIEW**

「五个类型入口」→ do not hardcode a number; say 「模板声明的各类型入口及内容目录」. OVERVIEW remember example: `--type <feedback|project|reference|skills|user>`.

- [ ] **Step 4: reshape extract table**

Add: 个人偏好 / 凭据 / 不得公开 → `user`（gitignore，不进 git）.

- [ ] **Step 5: Changelogs + versions** as above (Keep a Changelog, move Unreleased into dated section). Do not tag from this PR branch.

- [ ] **Step 6: Commit**

```bash
git add extensions/skills/project-memory-remember \
        extensions/skills/project-memory-init/SKILL.md \
        extensions/skills/project-memory-init/CHANGELOG.md \
        extensions/skills/project-memory-init/scripts/OVERVIEW.md \
        extensions/skills/project-memory-init/references/LAYOUT.md \
        extensions/skills/project-memory-reshape
git commit -m "docs(memory): document user type gate and gitignore layout

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

Ask and doctor SKILL.md do not hardcode the current type list — leave them. PROTOCOL.md does not list concrete types — leave it.

---

### Task 6: Backup skill

**Files:**
- Create: `extensions/skills/user-memory-backup/scripts/backup.py`
- Create: `extensions/skills/user-memory-backup/SKILL.md`
- Create: `extensions/skills/user-memory-backup/CHANGELOG.md`
- Create: `extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py` (backup half first)

**Interfaces:**
- Produces: `backup_user_memory(repo_dir: Path, output_dir: Path | None = None, timestamp: str | None = None) -> Path`
- Archive members use repo-relative paths `.memory/USER.md` and `.memory/users/...`
- Filename: `user-memory-backup-<timestamp>.tar.gz` where timestamp is UTC `YYYYMMDDTHHMMSSZ`
- Default `output_dir` is `repo_dir`
- Raises `ValueError` if neither USER.md nor any file under users/ exists
- Never runs `git add`

- [ ] **Step 1: Write the failing test** in `test_user_memory_archive.py`

```python
#!/usr/bin/env python3
"""Backup/restore packs USER.md and users/, refuses overwrite without force."""

from __future__ import annotations

import sys
import tarfile
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
BACKUP = SCRIPTS.parents[1] / "user-memory-backup" / "scripts"
RESTORE = SCRIPTS.parents[1] / "user-memory-restore" / "scripts"
for extra in (SCRIPTS, BACKUP, RESTORE):
    if str(extra) not in sys.path:
        sys.path.insert(0, str(extra))


class BackupTests(unittest.TestCase):
    def test_backup_packs_user_md_and_users(self) -> None:
        from backup import backup_user_memory

        with tempfile.TemporaryDirectory() as raw:
            repo = Path(raw) / "repo"
            users = repo / ".memory" / "users"
            users.mkdir(parents=True)
            (repo / ".memory" / "USER.md").write_text("# USER\n", encoding="utf-8")
            (users / "user_pref.md").write_text("secret token xyz\n", encoding="utf-8")
            archive = backup_user_memory(repo, timestamp="20260911T120000Z")
            self.assertEqual(archive.name, "user-memory-backup-20260911T120000Z.tar.gz")
            self.assertEqual(archive.parent, repo)
            with tarfile.open(archive, "r:gz") as tar:
                names = set(tar.getnames())
            self.assertIn(".memory/USER.md", names)
            self.assertIn(".memory/users/user_pref.md", names)

    def test_backup_errors_when_nothing_to_pack(self) -> None:
        from backup import backup_user_memory

        with tempfile.TemporaryDirectory() as raw:
            repo = Path(raw)
            with self.assertRaises(ValueError):
                backup_user_memory(repo)
```

- [ ] **Step 2: Run to verify it fails** (`ModuleNotFoundError: backup`)

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py BackupTests -v
```

- [ ] **Step 3: Implement `backup.py`**

CLI: `--repo-dir` required, `--output-dir` optional, `--timestamp` optional (tests inject; agents omit). Write tar.gz with `tarfile`. Do not call git.

SKILL.md frontmatter:

```yaml
---
name: user-memory-backup
description: 把本仓库 gitignore 的用户记忆（.memory/users/ 与 .memory/USER.md）打成归档。换机、删仓或想留一份逃生副本时用。默认写到仓库根 user-memory-backup-<时间戳>.tar.gz，不要 git add。恢复用 user-memory-restore。
version: 1.0.0
---
```

Steps: ask/accept output dir (default repo root); run `python3 <skill-dir>/scripts/backup.py --repo-dir <repo> [--output-dir <dir>]`; report path; never `git add`.

CHANGELOG 1.0.0 Added.

- [ ] **Step 4: Re-run BackupTests — PASS**

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/user-memory-backup \
        extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py
git commit -m "feat(skills): add user-memory-backup archive skill

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 7: Restore / reinject skill

**Files:**
- Create: `extensions/skills/user-memory-restore/scripts/restore.py`
- Create: `extensions/skills/user-memory-restore/SKILL.md`
- Create: `extensions/skills/user-memory-restore/CHANGELOG.md`
- Modify: `extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py`

**Interfaces:**
- Produces: `restore_user_memory(archive: Path, repo_dir: Path, force: bool = False) -> dict`
- Extracts only members under `.memory/USER.md` or `.memory/users/` (reject `..` / absolute paths)
- Overwrite gate: `--force` required if any `.memory/users/user_*.md` exists, or `.memory/USER.md` exists and its entries block is not the empty placeholder `- 暂无条目。`. Empty `users/` from init and empty-index USER.md do not block.
- After extract, if `repo_dir / AGENTS.md` is managed, refresh the `user` index via `nodes.entries.refresh_index(repo_dir, "user")` so USER.md matches entries. Do not call init.

- [ ] **Step 1: Write the failing tests**

```python
class RestoreTests(unittest.TestCase):
    def test_restore_reinjects_user_md_and_users(self) -> None:
        from backup import backup_user_memory
        from restore import restore_user_memory

        with tempfile.TemporaryDirectory() as raw:
            src = Path(raw) / "src"
            dest = Path(raw) / "dest"
            users = src / ".memory" / "users"
            users.mkdir(parents=True)
            (src / ".memory" / "USER.md").write_text(
                "<!-- project-memory-entries:start -->\n"
                "- [pref](users/user_pref.md) — personal\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            (users / "user_pref.md").write_text("token=abc\n", encoding="utf-8")
            archive = backup_user_memory(src, timestamp="20260911T130000Z")
            dest.mkdir()
            restore_user_memory(archive, dest)
            self.assertEqual(
                (dest / ".memory" / "users" / "user_pref.md").read_text(encoding="utf-8"),
                "token=abc\n",
            )
            self.assertTrue((dest / ".memory" / "USER.md").is_file())

    def test_restore_refuses_overwrite_without_force(self) -> None:
        from backup import backup_user_memory
        from restore import restore_user_memory

        with tempfile.TemporaryDirectory() as raw:
            src = Path(raw) / "src"
            dest = Path(raw) / "dest"
            for tree in (src, dest):
                (tree / ".memory" / "users").mkdir(parents=True)
                (tree / ".memory" / "users" / "user_keep.md").write_text(
                    "keep\n", encoding="utf-8"
                )
                (tree / ".memory" / "USER.md").write_text(
                    "<!-- project-memory-entries:start -->\n"
                    "- [keep](users/user_keep.md) — x\n"
                    "<!-- project-memory-entries:end -->\n",
                    encoding="utf-8",
                )
            archive = backup_user_memory(src, timestamp="20260911T140000Z")
            with self.assertRaises(ValueError):
                restore_user_memory(archive, dest, force=False)
            restore_user_memory(archive, dest, force=True)
            self.assertTrue((dest / ".memory" / "users" / "user_keep.md").is_file())
```

- [ ] **Step 2: Run to verify FAIL** (`ModuleNotFoundError: restore`)

```bash
python3 extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py RestoreTests -v
```

- [ ] **Step 3: Implement `restore.py` + SKILL.md**

SKILL.md: name `user-memory-restore`, version 1.0.0. Inputs: archive path, target repo dir, confirm/`--force` if occupied. After restore, if the dir already has project-memory, refresh `user` index only. Never `git add`.

CLI: `--archive`, `--repo-dir`, `--force`.

- [ ] **Step 4: Re-run RestoreTests + BackupTests — PASS**

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/user-memory-restore \
        extensions/skills/project-memory-init/scripts/tests/test_user_memory_archive.py
git commit -m "feat(skills): add user-memory-restore reinject skill

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 8: Refresh Edges memory indexes, symlink skills, note type_set wired

**Files:**
- Modify: root / `extensions/` / `project-memory-init/` (and other existing memory-dir) `AGENTS.md` local blocks via `memory.py init`
- Modify: `extensions/skills/project-memory-init/.memory/projects/project_type_set.md` via `memory.py remember --type project --slug type_set`
- Create: `.agents/skills/user-memory-backup` and `user-memory-restore` via `pnpm skills:link`
- Do not `git add` any `.memory/USER.md` or `.memory/users/`

**Interfaces:**
- Produces: committed `AGENTS.md` lists `.memory/USER.md` so agents know to read the local (gitignored) index. `project_type_set` says skill wiring is done; still no v1 promotion; still no `private` field.

- [ ] **Step 1: Run init on each existing memory directory** (root, `extensions`, `extensions/skills/project-memory-init`, `knowledge/tasks`, `knowledge/teaching`, `shared-extensions` if they have `.memory/`). Command:

```bash
python3 extensions/skills/project-memory-init/scripts/memory.py init \
  --target-dir <dir> --root-dir "$(pwd)"
```

Confirm `git check-ignore -v .memory/USER.md .memory/users/` reports ignored. Do not stage those paths.

- [ ] **Step 2: Remember type_set** — update How to apply: skill wiring is this PR; agents use local USER.md; do not design promotion; `private` metadata is a separate backlog item, not this change.

- [ ] **Step 3: `pnpm skills:link`** (or `./scripts/link-agent-skills`) so `.agents/skills/user-memory-*` are relative symlinks.

- [ ] **Step 4: `git add` only committable files. Verify `git status` has no USER.md / users/ / backup archives.**

- [ ] **Step 5: Commit**

```bash
git commit -m "chore(memory): refresh AGENTS for user index and link backup skills

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 9: Full suite + verification

- [ ] **Step 1: Run the existing test suite**

```bash
python3 -m unittest discover -s extensions/skills/project-memory-init/scripts/tests -v
```

Expected: all PASS, including frontmatter, user type, backup, restore.

- [ ] **Step 2: Extra checks**

```bash
python3 extensions/skills/project-memory-init/scripts/memory.py remember --help
# choices include user
git check-ignore -v .memory/USER.md .memory/users/ user-memory-backup-demo.tar.gz
pnpm skills:link -- --check
```

- [ ] **Step 3: If anything fails, fix and re-run. Do not weaken tests.**

- [ ] **Step 4: Commit any fixes. Open/update the PR (separate from merged docs PR #38). Title/body reference #21 and ADR-0003. Mention `private` metadata was raised and deferred to the backlog task.**

---

## Spec coverage (self-review)

| Requirement | Task |
| --- | --- |
| Writable type `user`, layout users/ + USER.md + user_<slug>.md | 1–3 |
| SoT in-repo, gitignored, never enter git | 4, 8 |
| Per-repo binding (same as other types) | 1–3 (no machine vault) |
| Content: personal prefs, credentials OK because gitignore | 5 |
| Escape: backup + restore; user-picked dir; default repo-root `user-memory-backup-*.tar.gz` | 6–7 |
| v1 no promotion | 5, 8 |
| Ignore `.memory/USER.md` (ADR Open confirmed) | 4 |
| Types derived from AGENTS.tmpl.md | 1 |
| remember forbids secrets except `--type user` | 5 |
| ask/doctor/reshape only if they hardcode types | 5 (reshape table only) |
| LAYOUT not PROTOCOL | 5 |
| Refresh root AGENTS; do not commit user content | 8 |
| Plan file on the PR branch | this file, committed first |
| No task-board status change | Global Constraints |
| No `private` metadata | Global Constraints |

## Placeholder scan

No TBD / implement-later / similar-to-Task-N without code.

## Type consistency

- `backup_user_memory(repo_dir, output_dir=None, timestamp=None) -> Path`
- `restore_user_memory(archive, repo_dir, force=False) -> dict`
- remember type string is `"user"`; index file `"USER.md"`; dir `"users"`
