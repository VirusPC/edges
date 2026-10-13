#!/usr/bin/env python3
"""Migrate teaching prefixes and physical roots to the top-level teaching workspace.

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
LEGACY_ALIAS = re.compile(r"(alias[ \t]+\S*?)/teach/")
HAS_TEACHING_LOCATION = re.compile(r"location[ \t]+(?:\^[~*=][ \t]+)?/teaching/")
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
    locations = list(iter_blocks(block, LOCATION_HEADER))
    # Read only server-level directives, leaving roots used by other locations intact.
    server_body = block
    for match, loc in reversed(locations):
        server_body = server_body[:match.start()] + server_body[match.start() + len(loc):]
    inherited = re.search(r"^[ \t]*root\s+([^;]+);", server_body, re.M)
    inherited_root = inherited.group(1).strip() if inherited else ""
    pieces = []
    last = 0
    for match, loc in locations:
        header = match.group(0)
        uri = location_uri(match.group(2))
        body = loc[len(header):]
        pieces.append(block[last:match.start()])
        if uri in ("/teach/", "/teach") and not body_looks_like_redirect(body):
            header = re.sub(r"/teach/?(?=[ \t{])", "/teaching/", header, count=1)
            body = LEGACY_ALIAS.sub(r"\1/teaching/", body)
            uri = "/teaching/"
        if (uri == "/teaching" or uri.startswith("/teaching/")) and not body_looks_like_redirect(body):
            body = re.sub(r"(\broot\s+)([^;\s]+?)/knowledge/?(?=\s*;)", r"\1\2", body)
            body = re.sub(r"(\balias\s+)([^;\s]+?)/knowledge/teaching(?=/|\s*;)", r"\1\2/teaching", body)
            if not re.search(r"\b(?:root|alias)\s+", re.sub(r"#.*", "", body)) and inherited_root.rstrip("/").endswith("/knowledge"):
                new_root = inherited_root.rstrip("/")[:-len("/knowledge")]
                indent = match.group(1) + "    "
                body = "\n" + indent + "root " + new_root + ";" + body
        pieces.append(header + body)
        last = match.start() + len(loc)
    pieces.append(block[last:])
    updated = "".join(pieces)
    return updated, updated != block


def insert_redirects(block, server_indent):
    # An exact redirect would override existing prefix homepage handlers too.
    has_root_location = any(
        location_uri(match.group(2)) == "/"
        for match in LOCATION_HEADER.finditer(block)
    )
    if has_root_location and HAS_TEACH_EXACT_REDIRECT.search(
        block
    ) and HAS_TEACH_REWRITE.search(block):
        return block, False
    indent = server_indent + "    "
    parts = []
    if not has_root_location:
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
        print("already uses /teaching/ and current physical roots (idempotent) in %s" % path)
        return 0
    path.write_text(updated)
    print("migrated teaching prefix/physical roots in %s" % path)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
