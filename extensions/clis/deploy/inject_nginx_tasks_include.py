#!/usr/bin/env python3
"""Insert an include line into nginx server blocks that already serve /teaching/.

Python 3.6 compatible (Alibaba Linux). No type annotations.
Usage: inject_nginx_tasks_include.py <teaching.conf> <include-line>

Matches /teaching/ only. Does not recognize leftover teach.conf or /teach/.
"""
from __future__ import print_function

import pathlib
import re
import sys


def already_included(text):
    return "edges-tasks.conf" in text


def inject_into_teaching_servers(text, include_line):
    if already_included(text):
        return text, False

    pattern = re.compile(r"^([ \t]*)server[ \t]*\{", re.M)
    pieces = []
    last = 0
    changed = False
    for match in pattern.finditer(text):
        start = match.start()
        i = match.end()
        depth = 1
        while i < len(text) and depth:
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            i += 1
        block = text[start:i]
        pieces.append(text[last:start])
        if "/teaching/" in block:
            indent = match.group(1) + "    "
            insert = (
                match.group(0)
                + "\n"
                + indent
                + "# edges persistent /tasks/ board; keep /teaching/\n"
                + indent
                + include_line
                + "\n"
                + text[match.end() : i]
            )
            pieces.append(insert)
            changed = True
        else:
            pieces.append(block)
        last = i
    pieces.append(text[last:])
    return "".join(pieces), changed


def main(argv):
    if len(argv) != 3:
        print("usage: inject_nginx_tasks_include.py <teaching.conf> <include-line>", file=sys.stderr)
        return 2
    path = pathlib.Path(argv[1])
    include_line = argv[2]
    text = path.read_text()
    if already_included(text):
        print("%s already includes edges-tasks.conf" % path)
        return 0
    updated, changed = inject_into_teaching_servers(text, include_line)
    if not changed:
        migrator = (
            pathlib.Path(__file__).resolve().parents[2]
            / "services"
            / "artifacts-preview"
            / "deploy"
            / "migrate-teaching-nginx-prefix.py"
        )
        print(
            "no server { block containing /teaching/ in %s — leftover teach.conf / /teach/ "
            "must be migrated first:\n"
            "  python3 %s %s\n"
            "then re-run setup-nginx-tasks.sh.\n"
            "This injector matches /teaching/ only."
            % (path, migrator, path),
            file=sys.stderr,
        )
        return 1
    path.write_text(updated)
    print("inserted include into server { blocks that serve /teaching/ in %s" % path)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
