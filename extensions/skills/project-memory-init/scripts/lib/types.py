#!/usr/bin/env python3
"""Types are discovered from scope links and type metadata in both containers."""
from __future__ import annotations
import re
from dataclasses import dataclass, replace
from pathlib import Path
from lib.blocks import ENTRIES_START, LOCAL_END, LOCAL_START, TYPE_META_END, TYPE_META_START, block_pattern, build_local_block, index_files
from lib.paths import AGENTS_FILE_NAME, assert_scope_path, module_for_type, type_dir_name, type_from_dir_name, type_index_relpath, write_atomic
from lib.templates import ENTRY_LINE_TEMPLATE, render_line

MEMORY_TYPE_NAMES = ('user', 'feedback', 'project', 'reference')
SKILL_TYPE_NAMES = ('managed', 'referenced')
SEED_TYPE_NAMES = (*MEMORY_TYPE_NAMES, *SKILL_TYPE_NAMES)
TYPE_NAME_PATTERN = re.compile(r'^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$')
TYPE_LINK_PATTERN = re.compile(r'\]\((\.harness/(memory|skills)/([^/\s)]+)/AGENTS\.md)\)')

@dataclass(frozen=True)
class TypeSpec:
    name: str
    index_file: str
    description: str = ''
    writable: bool = True
    gitignore: bool = False
    format: str = 'ordinary'
    module: str = 'memory'


def seed_index_files() -> dict[str, str]:
    return index_files()


def type_index_template_name(entry_type: str) -> str:
    return f'{entry_type.upper()}.md'


def index_file_name(entry_type: str, module: str | None = None) -> str:
    return type_index_relpath(entry_type, module)


def validate_type_name(entry_type: str) -> str:
    name = (entry_type or '').strip()
    if name.lower() in SEED_TYPE_NAMES:
        raise ValueError(f'不能用 add-type 登记官方种子类型: {name.lower()}')
    if not TYPE_NAME_PATTERN.fullmatch(name):
        raise ValueError('--name 必须是小写 snake_case，例如 docs 或 my_type，不能用 kebab-case')
    return name


def parse_type_meta(text: str) -> TypeSpec | None:
    match = block_pattern(TYPE_META_START, TYPE_META_END).search(text)
    if not match:
        return None
    fields = {}
    for raw in match.group(0).splitlines()[1:-1]:
        key, sep, value = raw.partition(':')
        if sep:
            fields[key.strip()] = value.strip()
    name = fields.get('name', '')
    if not TYPE_NAME_PATTERN.fullmatch(name):
        raise ValueError('Invalid type metadata name')
    if name not in SEED_TYPE_NAMES:
        missing_privileges = {'writable', 'gitignore'} - fields.keys()
        if missing_privileges:
            raise ValueError(
                'Missing custom type privilege metadata; restore original permissions: '
                + ', '.join(sorted(missing_privileges))
            )
    module = fields.get('module', module_for_type(name))
    if module not in {'memory', 'skills'}:
        raise ValueError('Invalid type module')
    for key in ('writable', 'gitignore'):
        if key in fields and fields[key] not in {'true', 'false'}:
            raise ValueError(f'Invalid type flag: {key}')
    fmt = fields.get('format', 'ordinary')
    if fmt not in {'ordinary', 'skills'}:
        raise ValueError('Invalid type format')
    return TypeSpec(name, index_file_name(name, module), fields.get('description', ''), fields.get('writable', 'true') == 'true', fields.get('gitignore', 'false') == 'true', fmt, module)


def layer_type_specs(target: Path) -> list[TypeSpec]:
    candidates = {}
    agents = target / AGENTS_FILE_NAME
    if agents.is_file():
        match = block_pattern(LOCAL_START, LOCAL_END).search(agents.read_text(encoding='utf-8'))
        if match:
            for rel, module, dirname in TYPE_LINK_PATTERN.findall(match.group(0)):
                candidates[rel] = (module, dirname)
    for module in ('memory', 'skills'):
        container = target / '.harness' / module
        assert_scope_path(container, target)
        if container.is_dir():
            for path in sorted(container.glob('*/AGENTS.md')):
                assert_scope_path(path, target)
                if ENTRIES_START in path.read_text(encoding='utf-8'):
                    candidates[path.relative_to(target).as_posix()] = (module, path.parent.name)
    result = {}
    for rel, (module, dirname) in candidates.items():
        path = assert_scope_path(target / rel, target)
        parsed = parse_type_meta(path.read_text(encoding='utf-8')) if path.is_file() else None
        name = parsed.name if parsed else type_from_dir_name(dirname)
        if parsed is None and name not in SEED_TYPE_NAMES:
            raise ValueError(f'Missing custom type index/metadata; restore original permissions: {rel}')
        if parsed and parsed.module != module:
            raise ValueError(f'Type module disagrees with path: {rel}')
        if name in SEED_TYPE_NAMES and rel != index_file_name(name):
            raise ValueError(f'Official type path conflict: {name}')
        if name in result and result[name].index_file != rel:
            raise ValueError(f'Duplicate type identity: {name}')
        spec = parsed or TypeSpec(name, rel, seed_description(name), name != 'referenced', name == 'user', 'skills' if name in SKILL_TYPE_NAMES else 'ordinary', module)
        if name == 'user' and not spec.gitignore:
            raise ValueError('user must remain private (gitignore: true)')
        if name == 'managed' and (not spec.writable or spec.format != 'skills'):
            raise ValueError('managed must remain writable skills')
        if name == 'referenced' and (spec.writable or spec.format != 'skills'):
            raise ValueError('referenced must remain index-only skills')
        result[name] = replace(spec, index_file=rel, module=module)
    order = {name: i for i, name in enumerate(SEED_TYPE_NAMES)}
    return sorted(result.values(), key=lambda spec: order.get(spec.name, len(order)))


def discover_layer_types(target: Path) -> dict[str, str]:
    return {spec.name: spec.index_file for spec in layer_type_specs(target)}


def seed_description(name: str) -> str:
    block = build_local_block()
    match = re.search(rf'\]\({re.escape(index_file_name(name))}\) — (.*)', block)
    return match.group(1) if match else name


def layer_writable_types(target: Path) -> tuple[str, ...]:
    return tuple(spec.name for spec in layer_type_specs(target) if spec.writable)


def reject_unwritable_type(target: Path, entry_type: str) -> str:
    specs = {spec.name: spec for spec in layer_type_specs(target)}
    if entry_type in specs and not specs[entry_type].writable:
        return f'--type {entry_type} 只索引，不能 remember'
    return f'--type 未在该层登记为可写类型: {entry_type}。已登记可写类型: {", ".join(layer_writable_types(target)) or "(none)"}'


def gitignore_patterns(entry_type: str, module: str | None = None, index_file: str | None = None) -> tuple[str, ...]:
    directory = str(Path(index_file or index_file_name(entry_type, module)).parent)
    return (f'{directory}/', f'**/{directory}/')


def find_git_root(start: Path) -> Path | None:
    return next((p for p in (start, *start.parents) if (p / '.git').exists()), None)


def ensure_type_gitignore(repo_root: Path, entry_type: str, module: str | None = None, index_file: str | None = None) -> str:
    if not (repo_root / '.git').exists():
        return 'skipped-no-git'
    path = assert_scope_path(repo_root / '.gitignore', repo_root)
    existing = path.read_text(encoding='utf-8') if path.exists() else ''
    missing = [p for p in gitignore_patterns(entry_type, module, index_file) if p not in existing.splitlines()]
    if not missing:
        return 'preserved'
    write_atomic(path, existing.rstrip() + f'\n\n# Private harness type {entry_type}\n' + '\n'.join(missing) + '\n')
    return 'updated'


def upsert_local_type_line(document: str, index_file: str, description: str) -> str:
    line = render_line(ENTRY_LINE_TEMPLATE, {'title': index_file, 'path': index_file, 'description': description})
    match = block_pattern(LOCAL_START, LOCAL_END).search(document)
    if not match:
        raise ValueError('AGENTS.md 缺少本层记忆区块，请先 init')
    block = match.group(0)
    if re.search(rf'^- \[[^\]]*\]\({re.escape(index_file)}\)(?: — .*)?$', block, re.MULTILINE):
        return document
    return document[:match.start()] + block.replace(LOCAL_END, f'{line}\n{LOCAL_END}', 1) + document[match.end():]


def selected_local_block(specs: list[TypeSpec]) -> str:
    block = re.sub(r'^- \[.*\]\(\.harness/.*\).*\n?', '', build_local_block(), flags=re.MULTILINE)
    for spec in specs:
        block = upsert_local_type_line(block, spec.index_file, spec.description or spec.name)
    return block


def ensure_layer_type_gitignore(target: Path, entry_type: str) -> None:
    spec = next((s for s in layer_type_specs(target) if s.name == entry_type), None)
    if spec and spec.gitignore:
        root = find_git_root(target)
        if root:
            ensure_type_gitignore(root, entry_type, spec.module, spec.index_file)
