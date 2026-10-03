#!/usr/bin/env python3
"""Diagnose and repair adopted new-layout scopes; legacy conversion is separate."""
from __future__ import annotations
import os
from pathlib import Path
from lib.blocks import IMPORTANT_START, LOCAL_START, LOCAL_END, block_pattern, insert_inner_block, build_important_block
from lib.paths import AGENTS_FILE_NAME, assert_scope_path, is_scope, list_type_files, reject_legacy, relative_or_name, write_atomic
from lib.types import layer_type_specs, selected_local_block, upsert_local_type_line
from nodes.agents import classify_agents_file, drop_index_entries, find_index_anchor, read_index_entries, sync_index_entry, sync_target_agents
from nodes.entries import expected_index_document, is_skill_format, parse_frontmatter, refresh_index


def walk_owners(root: Path):
    """Only local scope candidates; no symlinks, containers, or nested Git roots."""
    for current, dirs, _files in os.walk(root, followlinks=False):
        owner = Path(current)
        dirs[:] = sorted(name for name in dirs if (not name.startswith('.') or name == '.harness') and name != 'node_modules' and not (owner / name).is_symlink() and not (owner / name / '.git').exists())
        if owner == root or is_scope(owner) or (owner / '.memory').exists() or any((owner / '.harness' / m).exists() for m in ('memory', 'skills')):
            yield owner


def discover_memory_dirs(root: Path) -> list[Path]:
    return [owner for owner in walk_owners(root) if is_scope(owner)]


def finding(code: str, path: Path, root: Path, detail: str, **extra) -> dict:
    return {'code': code, 'issue': code, 'path': relative_or_name(path, root), 'detail': detail, **extra}


def collect_findings(root: Path) -> list[dict]:
    findings = []
    owners = list(walk_owners(root))
    scopes = {owner for owner in owners if is_scope(owner)}
    for owner in owners:
        try:
            reject_legacy(owner)
        except ValueError as error:
            findings.append(finding('migration-required', owner, root, str(error)))
            continue
        try:
            specs = layer_type_specs(owner)
            assert_scope_path(owner / AGENTS_FILE_NAME, owner)
        except (OSError, UnicodeError, ValueError) as error:
            findings.append(finding('unsafe-layout', owner, root, str(error)))
            continue
        if not specs and owner not in scopes:
            continue
        agents = owner / AGENTS_FILE_NAME
        state = classify_agents_file(agents)
        if state != 'managed':
            findings.append(finding('foreign-agents' if state == 'foreign' else 'missing-agents', agents, root, 'Attach managed blocks preserving manual text'))
        else:
            text = agents.read_text(encoding='utf-8')
            if IMPORTANT_START not in text:
                findings.append(finding('missing-important', agents, root, 'Missing constraints block'))
            match = block_pattern(LOCAL_START, LOCAL_END).search(text)
            if not match:
                findings.append(finding('outdated-local', agents, root, 'Missing type list'))
            else:
                for spec in specs:
                    if f']({spec.index_file})' not in match.group(0):
                        findings.append(finding('unregistered-type', owner / spec.index_file, root, 'Type is missing from scope list', owner=relative_or_name(owner, root)))
        for spec in specs:
            index = owner / spec.index_file
            if not index.exists():
                findings.append(finding('missing-index', index, root, 'Adopted type index is missing', owner=relative_or_name(owner, root), type=spec.name))
                continue
            try:
                expected = expected_index_document(owner, spec.name)
                pattern = '*/SKILL.md' if is_skill_format(owner, spec.name) else f'{spec.name}_*.md'
                for entry in list_type_files(owner, spec.name, pattern):
                    fields = parse_frontmatter(entry)
                    if not fields.get('description'):
                        findings.append(finding('invalid-entry', entry, root, 'Missing frontmatter description; source left unchanged'))
            except (OSError, UnicodeError, ValueError) as error:
                findings.append(finding('source-scan-error', index, root, str(error)))
                continue
            if index.read_text(encoding='utf-8') != expected:
                findings.append(finding('stale-index', index, root, 'Rebuild entries from current source', owner=relative_or_name(owner, root), type=spec.name))
        if owner in scopes:
            seen = set()
            for rel, description in read_index_entries(agents):
                if rel in seen:
                    findings.append(finding("duplicate", agents, root, rel, entry=rel, description=description))
                    continue
                seen.add(rel)
                child = (owner / rel).parent
                if child.resolve() not in scopes or child.is_symlink():
                    findings.append(finding('dead-entry', agents, root, rel, entry=rel))
                elif find_index_anchor(child, root) != owner:
                    findings.append(finding('misplaced', agents, root, rel, entry=rel, description=description))
    for owner in sorted(scopes):
        if owner == root:
            continue
        anchor = find_index_anchor(owner, root)
        relative = (owner.relative_to(anchor) / AGENTS_FILE_NAME).as_posix()
        if relative not in {rel for rel, _ in read_index_entries(anchor / AGENTS_FILE_NAME)}:
            findings.append(finding('unregistered', owner, root, 'Register under nearest owning scope'))
    return findings


def apply_findings(root: Path, findings: list[dict]) -> list[str]:
    repaired = []
    blocked = {root / f['path'] for f in findings if f['code'] in {'migration-required', 'unsafe-layout'}}
    for owner in walk_owners(root):
        if owner in blocked:
            continue
        try:
            specs = layer_type_specs(owner)
            if not specs and not is_scope(owner):
                continue
            path = assert_scope_path(owner / AGENTS_FILE_NAME, owner)
            if classify_agents_file(path) == 'foreign':
                existing = path.read_text(encoding='utf-8')
                updated = insert_inner_block(existing, LOCAL_START, selected_local_block(specs))
                write_atomic(path, updated)
            action = sync_target_agents(owner, root)
            if action != 'preserved':
                repaired.append(f'{action}-agents: {relative_or_name(owner, root)}')
            for spec in specs:
                try:
                    action = refresh_index(owner, spec.name)
                    if action != 'preserved':
                        repaired.append(f'{action}-index: {spec.index_file}')
                except (OSError, UnicodeError, ValueError):
                    # A failed scan must never replace its prior index with an empty one.
                    continue
        except (OSError, UnicodeError, ValueError):
            continue
    descriptions = {}
    for item in findings:
        if item['code'] in {'dead-entry', 'misplaced', 'duplicate'}:
            path = root / item['path']
            if path.parent in blocked:
                continue
            assert_scope_path(path, path.parent)
            if item['code'] in {'misplaced', 'duplicate'}:
                descriptions[(path.parent / item['entry']).parent] = item.get('description')
            if drop_index_entries(path, {item['entry']}):
                repaired.append(f"removed-entry: {item['entry']}")
    for owner in discover_memory_dirs(root):
        if owner == root or owner in blocked:
            continue
        anchor = find_index_anchor(owner, root)
        if anchor in blocked:
            continue
        action, entry, _ = sync_index_entry(anchor, owner, descriptions.get(owner))
        if action not in {'preserved', 'not-applicable', 'needs-doctor'}:
            repaired.append(f'registered: {entry}')
    return repaired


def doctor_memory(root: Path, apply: bool) -> dict[str, object]:
    findings = collect_findings(root)
    repaired = apply_findings(root, findings) if apply else []
    remaining = collect_findings(root) if apply else findings
    return {'operation': 'doctor', 'rootDir': str(root), 'applied': apply,
            'memoryDirs': [relative_or_name(p, root) for p in discover_memory_dirs(root)],
            'findings': findings, 'repaired': repaired, 'remaining': remaining}
