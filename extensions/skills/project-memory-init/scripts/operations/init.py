#!/usr/bin/env python3
"""Initialize only explicitly selected types; refresh adopted types on reruns."""
from __future__ import annotations
from pathlib import Path
from lib.blocks import load_agents_template
from lib.paths import AGENTS_FILE_NAME, assert_scope_path, memory_dir, reject_legacy, write_atomic
from lib.templates import read_index_template
from lib.types import MEMORY_TYPE_NAMES, SKILL_TYPE_NAMES, TypeSpec, ensure_type_gitignore, find_git_root, index_file_name, layer_type_specs, seed_description, type_index_template_name
from nodes.agents import find_index_anchor, rehome_index_entries, sync_index_entry, sync_target_agents
from nodes.entries import refresh_index


def init_memory(target: Path, root: Path, description: str | None = None, *, memory_types: list[str] | tuple[str, ...] | None = None, skill_types: list[str] | tuple[str, ...] | None = None) -> dict[str, object]:
    reject_legacy(target)
    if target != root:
        reject_legacy(root)
        assert_scope_path(root / AGENTS_FILE_NAME, root)
    load_agents_template()
    specs = {spec.name: spec for spec in layer_type_specs(target)}
    if not specs and memory_types is None and skill_types is None:
        return {'operation': 'init', 'targetDir': str(target), 'selectionRequired': True,
                'recommendations': {'modules': ['memory', 'skills', 'tasks'], 'memoryTypes': list(MEMORY_TYPE_NAMES), 'skillTypes': list(SKILL_TYPE_NAMES)}}
    for module, selected, allowed in [('memory', memory_types, MEMORY_TYPE_NAMES), ('skills', skill_types, SKILL_TYPE_NAMES)]:
        for name in selected or ():
            if name not in allowed:
                raise ValueError(f'Unknown {module} type: {name}; register custom types with add-type')
            specs.setdefault(name, TypeSpec(name, index_file_name(name, module), seed_description(name), name != 'referenced', name == 'user', 'skills' if module == 'skills' else 'ordinary', module))
    if not specs:
        raise ValueError('Select at least one memory or skill type')
    assert_scope_path(target / AGENTS_FILE_NAME, target)
    for spec in specs.values():
        assert_scope_path(target / spec.index_file, target)
    created, preserved, diagnostics = [], [], []
    for spec in specs.values():
        if spec.gitignore:
            git_root = find_git_root(target)
            if git_root:
                ensure_type_gitignore(git_root, spec.name, spec.module, spec.index_file)
        path = target / spec.index_file
        if path.exists():
            preserved.append(spec.index_file)
        else:
            write_atomic(path, read_index_template(type_index_template_name(spec.name), spec.name, spec.description,
                         flags={'module': spec.module, 'format': spec.format, 'writable': str(spec.writable).lower(), 'gitignore': str(spec.gitignore).lower()}))
            created.append(spec.index_file)
    for name in specs:
        try:
            refresh_index(target, name)
        except (OSError, UnicodeError, ValueError) as error:
            diagnostics.append({'code': 'source-scan-error', 'type': name, 'message': str(error)})
    agents_action = sync_target_agents(target, root)
    if target != root:
        reject_legacy(root)
        sync_target_agents(root, root)
    anchor = find_index_anchor(target, root)
    rehomed = rehome_index_entries(target, anchor, root) if target != root else {'inherited': [], 'detached': []}
    index_action, index_entry, index_description = sync_index_entry(anchor, target, description)
    return {'operation': 'init', 'targetDir': str(target), 'memoryDir': str(memory_dir(target)), 'agentsMd': str(target / AGENTS_FILE_NAME),
            'agentsAction': agents_action, 'rootDir': str(root), 'rootAgentsMd': str(root / AGENTS_FILE_NAME),
            'indexAnchor': str(anchor), 'indexAction': index_action, 'indexEntry': index_entry, 'indexDescription': index_description,
            'inheritedEntries': rehomed['inherited'], 'detachedEntries': rehomed['detached'], 'created': created, 'preserved': preserved,
            'selectionRequired': False, 'complete': not diagnostics, 'diagnostics': diagnostics}
