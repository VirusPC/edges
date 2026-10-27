#!/usr/bin/env python3
"""Rewrite in-repo path references after extensions/ was flattened to the repo root.

Preview by default. ``--apply`` writes. Safe to re-run: kept prefixes are gone
after the first apply, and relative links are only changed when they still
resolve through the pre-move path.

Does not edit pnpm-lock.yaml (recreate it with pnpm install), the decision
record, or this script.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KEPT = ("cli", "skills", "apps", "services", "mcp-servers", "system-prompt", ".edges")
DELETED = ("docs", "tools", "subagents", "new-server", "others")
SKIP_PREFIXES = (
    "docs/adr/0040-flatten-extensions-posts-to-personal-repo.md",
    "docs/migrations/2026-10-20-flatten-extensions.md",
    "CHANGELOG.md",
    ".edges/tasks/edges-extensions/todo/2026-10-20--框架仓平铺-extensions-并把-posts-搬回个人仓/",
    ".edges/memory/feedbacks/feedback_cli_under_extensions/INDEX.md",
    ".edges/memory/projects/project_root_important_scope/INDEX.md",
    "scripts/flatten-extensions-paths.py",
    "scripts/flatten-content-layout.mts",
    "scripts/migrate-recursive-layout.mts",
    "scripts/link-agent-skills",
    "docs/superpowers/plans/2026-10-05-local-ownership-correction.json",
    "cli/test/memory/adoption.test.ts",
    "cli/test/memory/instance-migration-port.test.ts",
    "cli/test/memory/ownership-correction.test.ts",
    "cli/test/memory/split-type-index-readme.test.ts",
    "cli/test/memory/top-level-layout.test.ts",
    "cli/test/schema/contract.test.ts",
    "pnpm-lock.yaml",
    # Installed on ECS by checksum. Do not change a byte.
    "services/artifacts-preview/deploy/edges-migrate-site-layout",
    "services/artifacts-preview/deploy/migrate-site-layout.sh",
    "services/artifacts-preview/deploy/migrate-teaching-nginx-prefix.py",
)
KNOWN_ROOT = {
    "docs", "scripts", ".github", ".edges", ".agents", "shared-extensions",
    "CHANGELOG.md", "README.md", "AGENTS.md", "CONTEXT.md", "package.json",
    "tsconfig.base.json", "pnpm-workspace.yaml", "LICENSE",
    *KEPT,
}
PREFIX_RE = re.compile(
    r"(?<![\w.-])extensions/(cli|skills|apps|services|mcp-servers|system-prompt|\.edges)(?![\w])"
)
DELETED_RE = re.compile(
    r"(?<![\w.-])extensions/(?:docs|tools|subagents|new-server|others)(?:/[A-Za-z0-9_./%-]*)?"
)
AGENTS_README_RE = re.compile(r"(?<![\w.-])extensions/(AGENTS\.md|README\.md)")
TOKEN_RE = re.compile(
    r"(?P<q>['\"`])(?P<p>\.\./[^'\"`\n]+)(?P=q)"
    r"|\]\(<(?P<a>\.\./[^>\n]+)>\)"
    r"|\]\((?P<b>\.\./[^)\s]+)\)"
)
TEST_LINE_RE = re.compile(
    r"\bimport\s*\(|\bfrom\s+['\"]|import\.meta\.dirname|fileURLToPath\(\s*import\.meta\.url\s*\)"
    r"|path\.resolve\(\s*pkgRoot|path\.resolve\(\s*__dirname|path\.resolve\(\s*path\.dirname"
    r"|path\.resolve\(\s*dirname\("
)


def git_renames() -> dict[str, str]:
    out = subprocess.check_output(
        ["git", "diff", "--cached", "--name-status", "-M", "--find-renames=80"],
        cwd=ROOT, text=True,
    )
    renames: dict[str, str] = {}
    for line in out.splitlines():
        parts = line.split("\t")
        if parts and parts[0].startswith("R") and len(parts) >= 3:
            renames[parts[2]] = parts[1]
    return renames


def skipped(rel: str) -> bool:
    return rel == "pnpm-lock.yaml" or any(rel.startswith(p) if p.endswith("/") else rel == p for p in SKIP_PREFIXES)


def is_test(rel: str) -> bool:
    return rel.endswith(".test.ts") or "/test/" in f"/{rel}" and rel.endswith((".ts", ".mjs", ".js", ".mts"))


def text_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff", ".woff2", ".ico"}:
        return None
    data = path.read_bytes()
    if b"\0" in data[:4096]:
        return None
    return data.decode("utf-8")


def line_at(text: str, idx: int) -> str:
    start = text.rfind("\n", 0, idx) + 1
    end = text.find("\n", idx)
    if end < 0:
        end = len(text)
    return text[start:end]


def resolve_old(old_dir: str, token: str) -> str:
    path = token.split("#", 1)[0].split("?", 1)[0]
    return os.path.normpath(os.path.join(old_dir, path)).replace("\\", "/")


def inside_kept(resolved: str) -> bool:
    if not resolved.startswith("extensions/"):
        return False
    rest = resolved[len("extensions/"):]
    return any(rest == name or rest.startswith(name + "/") for name in KEPT)


def target_ok(resolved: str) -> bool:
    if resolved in (".", ""):
        return True
    if resolved.startswith(".."):
        return False
    if inside_kept(resolved):
        return False
    if resolved == "extensions" or resolved.startswith("extensions/"):
        return False
    head = resolved.split("/", 1)[0]
    if (ROOT / resolved).exists():
        return True
    return head in KNOWN_ROOT


def new_token(new_dir: str, resolved: str, token: str) -> str:
    target = "." if resolved in (".", "") else resolved
    rel = os.path.relpath(target, new_dir).replace("\\", "/")
    if rel == ".":
        rel = "."
    suffix = ""
    base = token.split("#", 1)[0]
    if "#" in token:
        suffix += "#" + token.split("#", 1)[1]
    # query is inside the path portion before hash; preserve if present on the path part
    path_part, hash_part = (token.split("#", 1) + [""])[:2]
    query = ""
    if "?" in path_part:
        query = "?" + path_part.split("?", 1)[1]
        suffix = query + (("" if not hash_part else "") )
        # hash already included if we split wrong. Rebuild:
        suffix = query + (("" if "#" not in token else "") )
    # Simpler: cut the path, keep everything after the path.
    path_only = token
    extra = ""
    for i, ch in enumerate(token):
        if ch in "?#":
            path_only = token[:i]
            extra = token[i:]
            break
    rel_path = os.path.relpath("." if resolved in (".", "") else resolved, new_dir).replace("\\", "/")
    if not rel_path.startswith("."):
        rel_path = "./" + rel_path
    return rel_path + extra


def rewrite_relatives(text: str, old_rel: str, new_rel: str) -> tuple[str, int]:
    old_dir = str(Path(old_rel).parent)
    new_dir = str(Path(new_rel).parent)
    if old_dir == ".":
        old_dir = ""
    if new_dir == ".":
        new_dir = ""
    spans: list[tuple[int, int, str]] = []
    for match in TOKEN_RE.finditer(text):
        token = match.group("p") or match.group("a") or match.group("b")
        if token is None or "${" in token:
            continue
        line = line_at(text, match.start())
        base = old_dir
        if "pkgRoot" in line and "resolve" in line:
            base = str(Path(old_dir).parent) if old_dir else ".."
        resolved = resolve_old(base, token)
        if not target_ok(resolved):
            continue
        if is_test(new_rel) and not TEST_LINE_RE.search(line):
            continue
        new_base = new_dir
        if "pkgRoot" in line and "resolve" in line:
            new_base = str(Path(new_dir).parent) if new_dir else ".."
        updated = new_token(new_base, resolved, token)
        if updated == token:
            continue
        # Replace only the token characters, keep quotes or brackets.
        tok_start = match.start() + (match.group(0).find(token))
        tok_end = tok_start + len(token)
        spans.append((tok_start, tok_end, updated))
    if not spans:
        return text, 0
    for start, end, updated in reversed(spans):
        text = text[:start] + updated + text[end:]
    return text, len(spans)


def rewrite_prefixes(text: str) -> tuple[str, int]:
    count = 0

    def kept(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return match.group(1)

    text = PREFIX_RE.sub(kept, text)

    def deleted(_: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return "docs/migrations/2026-10-20-flatten-extensions.md"

    text = DELETED_RE.sub(deleted, text)

    def agents_readme(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return match.group(1)

    text = AGENTS_README_RE.sub(agents_readme, text)
    return text, count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    renames = git_renames()
    changed_files = 0
    rel_edits = 0
    prefix_edits = 0
    listed = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    files = [p for p in listed.decode().split("\0") if p]
    for rel in files:
        if skipped(rel):
            continue
        path = ROOT / rel
        text = text_file(path)
        if text is None:
            continue
        original = text
        nrel = 0
        if rel in renames:
            text, nrel = rewrite_relatives(text, renames[rel], rel)
        text, npre = rewrite_prefixes(text)
        if rel == "package.json":
            newer, n = re.subn(r"tsx \.\./\.\./scripts/", "tsx ../scripts/", text)
            if n:
                text = newer
                npre += n
        if text == original:
            continue
        changed_files += 1
        rel_edits += nrel
        prefix_edits += npre
        print(f"{rel}  relative={nrel} prefix={npre}")
        if args.apply:
            path.write_text(text)
    print(f"files={changed_files} relative={rel_edits} prefix={prefix_edits} apply={args.apply}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
