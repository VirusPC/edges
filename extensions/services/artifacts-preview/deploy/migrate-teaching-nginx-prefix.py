#!/usr/bin/env python3
"""Migrate leftover teaching.conf prefixes to canonical /teaching/.

One-shot leftover cleanup (old teach.conf / /teach/ names). Not current-state
ops: live Aliyun ECS already uses teaching.conf + /teaching/ (verified
2026-09-21). After migrate, each teaching server {} should have a single
`location = /` that 301s to `/teaching/` — do not stack a second one.

Python 3.6 compatible (Alibaba Linux). No type annotations.
Usage: migrate-teaching-nginx-prefix.py <teaching.conf>

Does not inject artifacts. After this, run:
  edges artifacts server setup-nginx
"""
from __future__ import print_function

import pathlib
import re
import sys


SERVER_HEADER = re.compile(r"^([ \t]*)server[ \t]*\{", re.M)
LOCATION_HEADER = re.compile(r"^([ \t]*)location[ \t]+([^{]+?)[ \t]*\{", re.M)
LEGACY_LOCATION = re.compile(
    r"(location[ \t]+(?:\^[~*=][ \t]+)?)(/teach/)"
)
LEGACY_ALIAS = re.compile(r"(alias[ \t]+\S*?)/teach/")
HAS_TEACHING_LOCATION = re.compile(r"location[ \t]+(?:\^[~*=][ \t]+)?/teaching/")
HAS_ROOT_REDIRECT = re.compile(
    r"location[ \t]+=[ \t]+/\s*\{[^}]*return[ \t]+30[12][ \t]+/teaching/"
)
HAS_TEACH_EXACT_REDIRECT = re.compile(
    r"location[ \t]+=[ \t]+/teach\s*\{[^}]*return[ \t]+30[12][ \t]+/teaching/"
)
HAS_TEACH_REWRITE = re.compile(r"rewrite[ \t]+\^/teach/")


def close_brace(text, header_end):
    depth = 1
    i = header_end
    while i < len(text) and depth:
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        i += 1
    return i


def iter_blocks(text, header_re):
    for match in header_re.finditer(text):
        end = close_brace(text, match.end())
        yield match, text[match.start() : end]


def location_uri(modifier_and_uri):
    rest = modifier_and_uri.strip()
    if rest.startswith("="):
        rest = rest[1:].strip()
        if rest.startswith("^"):
            rest = rest[1:].strip()
    elif rest.startswith("^~") or rest.startswith("~*") or rest.startswith("~"):
        rest = rest.split(None, 1)[-1]
    return rest.split()[0] if rest else ""


def body_looks_like_redirect(body):
    stripped = re.sub(r"#.*", "", body)
    if re.search(r"\b(try_files|alias|root|index|proxy_pass)\b", stripped):
        return False
    return bool(re.search(r"\b(return|rewrite)\b", stripped))


def rewrite_serving_legacy_locations(block):
    pieces = []
    last = 0
    changed = False
    for match, loc in iter_blocks(block, LOCATION_HEADER):
        header = match.group(0)
        uri = location_uri(match.group(2))
        body = loc[len(header) :]
        pieces.append(block[last : match.start()])
        if uri in ("/teach/", "/teach") and not body_looks_like_redirect(body):
            new_header = LEGACY_LOCATION.sub(r"\1/teaching/", header, count=1)
            if new_header == header and uri == "/teach":
                new_header = re.sub(
                    r"(location[ \t]+(?:=[ \t]+)?)(/teach)(?=[ \t{])",
                    r"\1/teaching/",
                    header,
                    count=1,
                )
            new_body = LEGACY_ALIAS.sub(r"\1/teaching/", body)
            pieces.append(new_header + new_body)
            changed = True
        else:
            pieces.append(loc)
        last = match.start() + len(loc)
    pieces.append(block[last:])
    return "".join(pieces), changed


def insert_redirects(block, server_indent):
    if HAS_ROOT_REDIRECT.search(block) and HAS_TEACH_EXACT_REDIRECT.search(
        block
    ) and HAS_TEACH_REWRITE.search(block):
        return block, False
    indent = server_indent + "    "
    parts = []
    if not HAS_ROOT_REDIRECT.search(block):
        parts.append(
            indent
            + "location = / {\n"
            + indent
            + "    return 301 /teaching/;\n"
            + indent
            + "}\n"
        )
    if not HAS_TEACH_EXACT_REDIRECT.search(block):
        parts.append(
            indent
            + "location = /teach {\n"
            + indent
            + "    return 301 /teaching/;\n"
            + indent
            + "}\n"
        )
    if not HAS_TEACH_REWRITE.search(block):
        parts.append(
            indent
            + "location /teach/ {\n"
            + indent
            + "    rewrite ^/teach/(.*)$ /teaching/$1 permanent;\n"
            + indent
            + "}\n"
        )
    if not parts:
        return block, False
    insert = "".join(parts)
    close = block.rfind("}")
    if close < 0:
        return block, False
    prefix = block[:close]
    if prefix and not prefix.endswith("\n"):
        prefix += "\n"
    return prefix + insert + block[close:], True


def is_teaching_server(block):
    return bool(
        HAS_TEACHING_LOCATION.search(block)
        or re.search(r"location[ \t]+(?:\^[~*=][ \t]+)?/teach(?:/|\s)", block)
        or "/teaching/" in block
    )


def migrate_text(text):
    pieces = []
    last = 0
    changed = False
    found = False
    for match, block in iter_blocks(text, SERVER_HEADER):
        pieces.append(text[last : match.start()])
        if not is_teaching_server(block):
            pieces.append(block)
        else:
            found = True
            updated, loc_changed = rewrite_serving_legacy_locations(block)
            updated, redir_changed = insert_redirects(updated, match.group(1))
            pieces.append(updated)
            if loc_changed or redir_changed:
                changed = True
        last = match.start() + len(block)
    pieces.append(text[last:])
    return "".join(pieces), changed, found


def main(argv):
    if len(argv) != 2:
        print("usage: migrate-teaching-nginx-prefix.py <teaching.conf>", file=sys.stderr)
        return 2
    path = pathlib.Path(argv[1])
    text = path.read_text()
    updated, changed, found = migrate_text(text)
    if not found:
        print(
            "no teaching server { block in %s — expected /teaching/"
            % path,
            file=sys.stderr,
        )
        return 1
    if not changed:
        print("already uses /teaching/ (idempotent) in %s" % path)
        return 0
    path.write_text(updated)
    print("migrated leftover prefix to /teaching/ in %s" % path)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
