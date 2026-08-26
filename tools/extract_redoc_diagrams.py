#!/usr/bin/env python3
"""Extract Mermaid payloads from REDoc text-draw tags."""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    text = args.source.read_text(encoding="utf-8")
    pattern = re.compile(
        r'<redoc-text-draw remoteTemplate="(.*?)"\s+(?:remoteView="[^"]+"\s+)?theme="light"/>',
        re.S,
    )
    matches = list(pattern.finditer(text))
    for idx, match in enumerate(matches, 1):
        mermaid = html.unescape(match.group(1)).replace("</br>", "<br/>")
        (args.output_dir / f"diagram-{idx}.mmd").write_text(mermaid + "\n", encoding="utf-8")
    print(len(matches))


if __name__ == "__main__":
    main()
