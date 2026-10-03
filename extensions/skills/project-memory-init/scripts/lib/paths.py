#!/usr/bin/env python3
"""Scope-relative paths and ownership checks for the .harness layout."""
from __future__ import annotations
import os
import tempfile
from pathlib import Path

HARNESS_DIR_NAME = '.harness'
MEMORY_DIR_NAME = '.harness/memory'
AGENTS_FILE_NAME = 'AGENTS.md'
AGENTS_DIR_NAME = '.agents'
EXTERNAL_CONTENT_DIRS = {'referenced': (AGENTS_DIR_NAME, 'skills')}
SKILL_DIR = Path(__file__).resolve().parents[2]
SEED_DIR_TO_TYPE = {'users': 'user', 'feedbacks': 'feedback', 'projects': 'project', 'references': 'reference'}


def assert_owned(path: Path, owner: Path) -> Path:
    """Reject symlinks escaping an owner, including linked ancestors and files."""
    owner_real = owner.resolve()
    # The owner itself cannot be a link redirected elsewhere in the selected scope.
    if path != owner and owner not in path.parents:
        raise ValueError(f'Path is outside selected owner: {path}')
    if not path.resolve().is_relative_to(owner_real):
        raise ValueError(f'Path resolves outside selected owner: {path}')
    return path


def assert_scope_path(path: Path, target: Path) -> Path:
    assert_owned(path, target)
    # Harness directories are managed local storage, never installation aliases.
    current = path
    while current != target:
        if current.is_symlink():
            raise ValueError(f'Managed path contains a symbolic link: {current}')
        current = current.parent
    return path


def reject_legacy(target: Path) -> None:
    agents = target / AGENTS_FILE_NAME
    if (target / '.memory').exists() or (agents.is_file() and '](.memory/' in agents.read_text(encoding='utf-8')):
        raise ValueError('migration-required: run project-memory-migrate before using this legacy layer')


def write_atomic(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent, delete=False) as handle:
            temporary_path = handle.name
            handle.write(content)
        os.replace(temporary_path, path)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)


def resolve_target(raw_target: str) -> Path:
    target = Path(raw_target).expanduser().resolve()
    if not target.is_dir():
        raise ValueError(f'目标目录不存在或不是目录: {target}')
    return target


def is_scope(target: Path) -> bool:
    path = target / AGENTS_FILE_NAME
    if not path.is_file() or path.is_symlink():
        return False
    text = path.read_text(encoding='utf-8')
    return '<!-- project-memory:start -->' in text and ('<!-- project-memory-local:start -->' in text or '<!-- project-memory-children:start -->' in text)


def resolve_root(target: Path, raw_root: str | None) -> Path:
    if raw_root:
        root = resolve_target(raw_root)
        if not target.is_relative_to(root):
            raise ValueError(f'root-dir 必须是 target-dir 的祖先目录: {root}')
        for parent in (target, *target.parents):
            if parent == root:
                break
            if (parent / '.git').exists():
                raise ValueError('root-dir cannot cross another Git root or submodule')
        return root
    for candidate in (target, *target.parents):
        if (candidate / '.git').exists():
            return candidate
    for candidate in (target, *target.parents):
        if is_scope(candidate):
            return candidate
    return target


def memory_dir(target: Path) -> Path:
    return target / MEMORY_DIR_NAME


def module_for_type(entry_type: str) -> str:
    return 'skills' if entry_type in {'managed', 'referenced'} else 'memory'


def type_dir_name(entry_type: str) -> str:
    if entry_type in {'managed', 'referenced'}:
        return entry_type
    return entry_type if entry_type.endswith('s') else f'{entry_type}s'


def type_from_dir_name(dir_name: str) -> str:
    return SEED_DIR_TO_TYPE.get(dir_name, dir_name)


def type_index_relpath(entry_type: str, module: str | None = None) -> str:
    return f'.harness/{module or module_for_type(entry_type)}/{type_dir_name(entry_type)}/{AGENTS_FILE_NAME}'


def type_index_path(target: Path, entry_type: str) -> Path:
    from lib.types import discover_layer_types
    return target / discover_layer_types(target).get(entry_type, type_index_relpath(entry_type))


def is_external_type(entry_type: str) -> bool:
    return entry_type in EXTERNAL_CONTENT_DIRS


def type_content_dir(target: Path, entry_type: str) -> Path:
    external = EXTERNAL_CONTENT_DIRS.get(entry_type)
    return target.joinpath(*external) if external else type_index_path(target, entry_type).parent


def relative_or_name(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.name


def relative_link(path: Path, base: Path) -> str:
    return Path(os.path.relpath(path, base)).as_posix()


def list_memory_files(target: Path, pattern: str = '*.md') -> list[Path]:
    from lib.types import discover_layer_types
    return sorted({p for name in discover_layer_types(target) if not is_external_type(name) for p in type_content_dir(target, name).rglob(pattern)})


def list_type_files(target: Path, entry_type: str, pattern: str = '*.md', *, recursive: bool = False) -> list[Path]:
    """Enumerate one source, distinguishing a failed scan from a successful empty one."""
    directory = type_content_dir(target, entry_type)
    external = is_external_type(entry_type)
    if not external:
        assert_scope_path(directory, target)
    if not directory.exists():
        raise ValueError(f'source-scan-error: missing source {directory}')
    if not directory.is_dir():
        raise ValueError(f'source-scan-error: not a directory {directory}')
    # Explicit scandir propagates permission failures (Path.glob can suppress them).
    with os.scandir(directory) as iterator:
        children = sorted((Path(item.path) for item in iterator), key=lambda p: p.name)
    paths = []
    skill_pattern = pattern == '*/SKILL.md'
    for child in children:
        if child.is_symlink() and not child.exists():
            raise ValueError(f'source-scan-error: broken link {child}')
        if skill_pattern:
            if not child.is_dir():
                continue
            candidate = child / 'SKILL.md'
            if not candidate.exists():
                if candidate.is_symlink():
                    raise ValueError(f'source-scan-error: broken link {candidate}')
                continue
            paths.append(candidate)
        elif child.match(pattern) and child.is_file():
            paths.append(child)
    seen = set()
    result = []
    for path in paths:
        if not external:
            assert_owned(path, directory)
        # Fail before updating any index when source cannot be read/decoded.
        path.read_text(encoding='utf-8')
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            result.append(path)
    return result
