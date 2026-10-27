#!/usr/bin/env python3
"""Rewrite in-repo path references after the packages/ workspace move.

Preview by default. ``--apply`` writes. Safe to re-run: prefixes and
``scripts/migrations/`` are not applied twice, and a relative link is
rewritten only when the resolved target still differs.

Does not edit pnpm-lock.yaml (recreate it with pnpm install), byte-identical
site-layout migrators, historical layout fixtures, or the flatten mapping.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

MOVED_SCRIPTS = (
    "flatten-content-layout.mts",
    "flatten-extensions-paths.py",
    "index-task-nodes.mts",
    "legacy-index.mts",
    "migrate-agents-indexes.mts",
    "migrate-content-units.mts",
    "edges-migrate-directory-nodes.mts",
    "migrate-harness-readme-index.mts",
    "migrate-index-to-INDEX.mts",
    "migrate-recursive-layout.mts",
    "migrate-task-project-lists.mts",
    "migrate-type-index-to-readme.mts",
    "restore-local-ownership.md",
    "restore-local-ownership.mts",
    "rewrite-project-harness-markers.mts",
    "split-type-index-readme.mts",
)

# Old directory → new directory. Longest prefix wins.
DIR_MOVES = (
    (".edges/evaluation", "packages/evaluation"),
    (".edges/observation", "packages/observation"),
    ("mcp-servers", "packages/mcp-servers"),
    ("system-prompt", "packages/system-prompt"),
    ("services", "packages/services"),
    ("skills", "packages/skills"),
    ("apps", "packages/apps"),
    ("cli", "packages/cli"),
)

SKIP_EXACT = {
    "pnpm-lock.yaml",
    "CHANGELOG.md",
    ".gitignore",
    "docs/adr/0040-flatten-extensions-posts-to-personal-repo.md",
    "docs/migrations/2026-10-20-flatten-extensions.md",
    "docs/superpowers/plans/2026-10-05-local-ownership-correction.json",
    "scripts/migrations/packages-layout-paths.py",
    "scripts/migrations/flatten-content-layout.mts",
    "scripts/migrations/migrate-recursive-layout.mts",
    "scripts/migrations/flatten-extensions-paths.py",
    "packages/services/artifacts-preview/deploy/edges-migrate-site-layout",
    "packages/services/artifacts-preview/deploy/migrate-site-layout.sh",
    "packages/services/artifacts-preview/deploy/migrate-teaching-nginx-prefix.py",
}

# Historical snapshots the migrators still consume. Imports are fixed separately.
FIXTURE_PREFIX_SKIP = {
    "packages/cli/test/memory/adoption.test.ts",
    "packages/cli/test/memory/instance-migration-port.test.ts",
    "packages/cli/test/memory/ownership-correction.test.ts",
    "packages/cli/test/memory/split-type-index-readme.test.ts",
    "packages/cli/test/memory/top-level-layout.test.ts",
    "packages/cli/test/memory/directory-migration.test.ts",
    "packages/cli/test/schema/contract.test.ts",
    "packages/cli/test/commands/init-service.test.ts",
}

DEEPER_ROOTS = (
    "packages/cli/",
    "packages/apps/",
    "packages/services/",
    "packages/mcp-servers/",
)

REL_TOKEN = re.compile(r"""(?P<q>['"`])(?P<p>\.\.?/[^'"`\n]+)(?P=q)""")
MD_LINK = re.compile(r"\]\(<(?P<a>\.\./[^>\n]+)>\)|\]\((?P<b>\.\./[^)\s]+)\)")
IMPORT_LINE = re.compile(
    r"\b(?:import\s*\(|from\s+|path\.(?:resolve|join)\(|new URL\(|readFile(?:Sync)?\(|fileURLToPath\()"
)
SCRIPT_IMPORT = re.compile(
    r"(?P<prefix>(?:\.\./)+)scripts/(?!migrations/)(?P<name>[\w.-]+\.(?:mts|mjs|ts|py|md))"
)
# Require a path character after the slash so a regex closer (`cli/`) is left
# alone. Do not rewrite the npm package `skills/package.json` or a harness
# href that already starts at `<skills/`.
PATH_PREFIX = re.compile(
    r"(?<![\w./-])(?<!<)(cli|skills|apps|services|mcp-servers|system-prompt)/(?!package\.json)(?=[\w.@-])"
)
EXTENSIONS_PREFIX = re.compile(
    r"(?<![\w.-])extensions/(cli|skills|apps|services|mcp-servers|system-prompt)/"
)
EDGES_PREFIX = re.compile(
    r"(?<![\w.-])edges/(cli|skills|apps|services|mcp-servers|system-prompt)/"
)
GITHUB_BLOB = re.compile(
    r"((?:blob|tree)/[^/\s`'\"]+/)(cli|skills|apps|services|mcp-servers|system-prompt)/"
)


def git_renames() -> dict[str, str]:
    out = subprocess.check_output(
        ["git", "diff", "--cached", "--name-status", "-M", "--find-renames=50"],
        cwd=ROOT,
        text=True,
    )
    renames: dict[str, str] = {}
    for line in out.splitlines():
        parts = line.split("\t")
        if parts and parts[0].startswith("R") and len(parts) >= 3:
            renames[parts[2]] = parts[1]
    return renames


def text_file(path: Path) -> str | None:
    if path.is_symlink() or not path.is_file():
        return None
    if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff", ".woff2", ".ico"}:
        return None
    data = path.read_bytes()
    if b"\0" in data[:4096]:
        return None
    return data.decode("utf-8")


def map_path(resolved: str) -> str | None:
    norm = resolved.replace("\\", "/")
    if norm in ("", "."):
        return norm
    if norm == ".." or norm.startswith("../"):
        return None
    for old, new in sorted(DIR_MOVES, key=lambda item: len(item[0]), reverse=True):
        if norm == old or norm.startswith(old + "/"):
            return new + norm[len(old):]
    for name in MOVED_SCRIPTS:
        old = f"scripts/{name}"
        if norm == old or norm.startswith(old + "/"):
            return f"scripts/migrations/{name}" + norm[len(old):]
    if (ROOT / norm).exists() or (ROOT / norm).is_symlink():
        return norm
    return None


def old_dir_for(rel: str, renames: dict[str, str]) -> str:
    old = renames.get(rel, rel)
    parent = str(Path(old).parent).replace("\\", "/")
    return "" if parent == "." else parent


def new_dir_for(rel: str) -> str:
    parent = str(Path(rel).parent).replace("\\", "/")
    return "" if parent == "." else parent


def split_extra(token: str) -> tuple[str, str]:
    for i, ch in enumerate(token):
        if ch in "?#":
            return token[:i], token[i:]
    return token, ""


def format_rel(target: str, base: str, trailing: bool) -> str:
    dest = "." if target in ("", ".") else target
    start = "." if base in ("", ".") else base
    rel = os.path.relpath(dest, start).replace("\\", "/")
    if not rel.startswith("."):
        rel = "./" + rel
    if trailing and rel not in (".", "./") and not rel.endswith("/"):
        rel += "/"
    return rel


def rewrite_token(token: str, old_dir: str, new_dir: str) -> str | None:
    path_only, extra = split_extra(token)
    trailing = path_only.endswith("/")
    resolved = os.path.normpath(os.path.join(old_dir, path_only.rstrip("/"))).replace("\\", "/")
    if resolved == ".":
        resolved = "."
    mapped = map_path(resolved)
    if mapped is None:
        return None
    updated = format_rel(mapped, new_dir, trailing)
    if updated == path_only:
        return None
    return updated + extra


def line_at(text: str, idx: int) -> str:
    start = text.rfind("\n", 0, idx) + 1
    end = text.find("\n", idx)
    if end < 0:
        end = len(text)
    return text[start:end]


def in_fence(text: str, idx: int) -> bool:
    fence = False
    for line in text[:idx].splitlines():
        if line.lstrip().startswith("```"):
            fence = not fence
    return fence


def apply_spans(text: str, spans: list[tuple[int, int, str]]) -> str:
    for start, end, updated in sorted(spans, reverse=True):
        text = text[:start] + updated + text[end:]
    return text


def rewrite_relatives(text: str, rel: str, renames: dict[str, str]) -> tuple[str, int]:
    if rel.endswith(".test.ts") or rel.endswith(".test.tsx") or "/test/" in f"/{rel}" and rel.endswith(
        (".ts", ".tsx", ".mjs", ".js")
    ):
        return text, 0
    if rel.startswith("packages/evaluation/reports/"):
        return text, 0
    old_dir = old_dir_for(rel, renames)
    new_dir = new_dir_for(rel)
    spans: list[tuple[int, int, str]] = []
    is_md = rel.endswith(".md")
    matches = MD_LINK.finditer(text) if is_md else REL_TOKEN.finditer(text)
    for match in matches:
        if is_md:
            if in_fence(text, match.start()):
                continue
            token = match.group("a") or match.group("b")
            whole = match.group(0)
            tok_at = match.start() + whole.find(token)
        else:
            if not IMPORT_LINE.search(line_at(text, match.start())):
                continue
            token = match.group("p")
            tok_at = match.start("p")
        if token is None or "${" in token:
            continue
        updated = rewrite_token(token, old_dir, new_dir)
        if updated is None or updated == token:
            continue
        spans.append((tok_at, tok_at + len(token), updated))
    if not spans:
        return text, 0
    return apply_spans(text, spans), len(spans)


def rewrite_script_imports(text: str, rel: str) -> tuple[str, int]:
    extra = "../" if rel.startswith(DEEPER_ROOTS) else ""

    def repl(match: re.Match[str]) -> str:
        return extra + match.group("prefix") + "scripts/migrations/" + match.group("name")

    updated, count = SCRIPT_IMPORT.subn(repl, text)
    return updated, count


def rewrite_script_names(text: str) -> tuple[str, int]:
    count = 0
    for name in MOVED_SCRIPTS:
        updated, n = re.subn(
            rf"(?<!migrations/)scripts/{re.escape(name)}",
            f"scripts/migrations/{name}",
            text,
        )
        text = updated
        count += n
    return text, count


def rewrite_prefixes(text: str) -> tuple[str, int]:
    count = 0

    def bump(n: int) -> None:
        nonlocal count
        count += n

    text, n = re.subn(r"(?<!packages/)\.edges/evaluation", "packages/evaluation", text)
    bump(n)
    text, n = re.subn(r"(?<!packages/)\.edges/observation", "packages/observation", text)
    bump(n)
    text, n = EXTENSIONS_PREFIX.subn(r"packages/\1/", text)
    bump(n)
    text, n = EDGES_PREFIX.subn(r"edges/packages/\1/", text)
    bump(n)
    text, n = GITHUB_BLOB.subn(r"\1packages/\2/", text)
    bump(n)
    text, n = PATH_PREFIX.subn(r"packages/\1/", text)
    bump(n)
    text, n = re.subn(
        r"tsx \.\./\.\./scripts/(?!migrations/)",
        "tsx ../../scripts/migrations/",
        text,
    )
    bump(n)
    return text, count


def skipped(rel: str) -> bool:
    if rel in SKIP_EXACT:
        return True
    if rel.startswith("packages/evaluation/reports/"):
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    renames = git_renames()
    listed = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    files = [p for p in listed.decode().split("\0") if p]
    changed_files = 0
    for rel in files:
        if skipped(rel):
            continue
        path = ROOT / rel
        text = text_file(path)
        if text is None:
            continue
        original = text
        text, _nrel = rewrite_relatives(text, rel, renames)
        text, _nimp = rewrite_script_imports(text, rel)
        if rel == "package.json":
            text = text.replace(
                "tsx ../scripts/",
                "tsx ../../scripts/migrations/",
            )
        text, _nname = rewrite_script_names(text)
        if rel not in FIXTURE_PREFIX_SKIP:
            text, _npre = rewrite_prefixes(text)
        if rel.endswith("flatten-extensions-paths.py"):
            text = text.replace(
                "ROOT = Path(__file__).resolve().parents[1]",
                "ROOT = Path(__file__).resolve().parents[2]",
                1,
            )
        if text == original:
            continue
        changed_files += 1
        print(rel)
        if args.apply:
            path.write_text(text)
    print(f"files={changed_files} apply={args.apply} renames={len(renames)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
