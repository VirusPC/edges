#!/usr/bin/env python3
"""Preflight, copy, validate and retire legacy Project Memory in selected scopes."""
from __future__ import annotations
import argparse
import base64
import json
import hashlib
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
from urllib.parse import unquote, quote

from legacy import parse, convert_index

RUNTIME = Path(__file__).resolve().parents[2] / 'project-memory-init/scripts'
sys.path.insert(0, str(RUNTIME))
from lib.paths import is_scope, resolve_root, assert_scope_path
from lib.types import layer_type_specs
from nodes.entries import parse_frontmatter

JOURNAL = '.project-memory-migration'
LINK = re.compile(r'\[([^\]\n]*)\]\(([^)\n]+)\)')


def lexical(path):
    return Path(os.path.abspath(path))


def present(path):
    return path.exists() or path.is_symlink()


def state(path):
    if not present(path):
        return None
    mode = stat.S_IMODE(path.lstat().st_mode)
    if path.is_symlink():
        return {'kind': 'link', 'data': os.readlink(path), 'mode': mode}
    if not path.is_file():
        raise ValueError('not-a-regular-file: ' + str(path))
    return {'kind': 'file', 'data': base64.b64encode(path.read_bytes()).decode(), 'mode': mode}


def file_state(data, mode=0o644):
    return {'kind': 'file', 'data': base64.b64encode(data).decode(), 'mode': mode}


def walk(root, exclude_installs=False):
    """No Git filtering: ignored and untracked data is intentionally included."""
    for base, dirs, files in os.walk(root, followlinks=False, onerror=lambda error: (_ for _ in ()).throw(error)):
        base = Path(base)
        for name in list(dirs):
            path = base / name
            if name in {'.git', JOURNAL, 'node_modules'} or (exclude_installs and name == '.agents' and not path.is_symlink()) or (path / '.git').exists():
                dirs.remove(name)
            elif path.is_symlink():
                dirs.remove(name)
                files.append(name)
        yield base, sorted(dirs), sorted(files)


def scopes(target, recursive):
    found = []
    if not recursive:
        return [target] if present(target / '.memory') else []
    for base, _dirs, _files in walk(target, exclude_installs=True):
        if present(base / '.memory'):
            found.append(base)
    return found


def rewrite_links(text, source, destination, mapped):
    def replace(match):
        label, raw = match.groups()
        if re.match(r'\w+:|/|#', raw):
            return match[0]
        path_part, mark, fragment = raw.partition('#')
        old = lexical(source.parent / unquote(path_part))
        new = mapped(old)
        if old == new and source.parent == destination.parent:
            return match[0]
        # Rebase links in moved documents even when their external target stays put.
        value = quote(os.path.relpath(new, destination.parent), safe='/._-')
        if label == raw:
            label = value + (mark + fragment if mark else '')
        return '[' + label + '](' + value + (mark + fragment if mark else '') + ')'
    # Fenced code examples and inline code are historical text, not live references.
    parts = re.split(r'(```.*?```|`[^`\n]*`)', text, flags=re.S)
    return ''.join(part if i % 2 else LINK.sub(replace, part) for i, part in enumerate(parts))


def safe_ancestors(path, root):
    if not path.is_relative_to(root):
        raise ValueError('outside-selected-scope: ' + str(path))
    current = path.parent
    while current != root.parent:
        if current.is_symlink():
            raise ValueError('symlink-ancestor: ' + str(current))
        if current == root:
            break
        current = current.parent


def valid_new_scope(scope):
    harness = scope / '.harness'
    if not present(harness):
        return False
    assert_scope_path(harness, scope)
    if not harness.is_dir() or not is_scope(scope):
        raise ValueError('unrelated-harness-conflict: ' + str(harness))
    specs = layer_type_specs(scope)
    text = (scope / 'AGENTS.md').read_text()
    if not specs or any(f']({s.index_file})' not in text for s in specs):
        raise ValueError('unrelated-harness-conflict: ' + str(harness))
    for spec in specs:
        index = scope / spec.index_file
        # Private indexes may be absent in a Git-upgraded clone.
        if not index.is_file() and not spec.gitignore:
            raise ValueError('missing-new-index: ' + str(index))
    # Legitimately adopted non-memory modules may coexist, but every child needs
    # an explicit AGENTS link. Historical unrelated .harness data is not adopted.
    for child in harness.iterdir():
        if child.name not in {'memory', 'skills'} and f'](.harness/{child.name}/AGENTS.md)' not in text:
            raise ValueError('unrelated-harness-conflict: ' + str(child))
    return True


def inventory(owner, spec):
    source = owner / '.agents/skills' if spec.name == 'agent_skills' else spec.directory
    if not source.is_dir():
        # Flat index without a content directory is deterministically empty only
        # for locally owned types. Missing referenced sources are never empty.
        if spec.name != 'agent_skills' and not present(source):
            return []
        raise OSError('source unavailable')
    with os.scandir(source) as entries:
        children = sorted((Path(e.path) for e in entries), key=str)
    paths = []
    for child in children:
        if child.is_symlink() and not child.exists():
            raise OSError('broken source link')
        if spec.format == 'skills':
            path = child / 'SKILL.md'
            if child.is_dir() and path.is_file():
                paths.append(path)
        elif child.is_file() and child.match(spec.name + '_*.md'):
            paths.append(child)
    unique, seen = [], set()
    for path in paths:
        real = path.resolve()
        if spec.name != 'agent_skills' and not real.is_relative_to(spec.directory.resolve()):
            raise ValueError('owned-body-symlink-escape: ' + str(path))
        if real not in seen:
            seen.add(real)
            unique.append(path)
    return unique


def source_diagnostic(owner):
    return {'code': 'source-scan-incomplete', 'path': str(owner / '.agents/skills'), 'detail': 'Referenced source unavailable; existing index and adoption preserved. Restore source and run project-memory-doctor.'}


def referenced_diagnostics(owner):
    from types import SimpleNamespace
    spec = SimpleNamespace(name='agent_skills', format='skills')
    try:
        for path in inventory(owner, spec):
            path.read_text()
    except (OSError, UnicodeError):
        return [source_diagnostic(owner)]
    return []


def rebuild_entries(text, owner, spec, index):
    lines = []
    for path in inventory(owner, spec):
        fields = parse_frontmatter(path)
        name = path.parent.name if spec.format == 'skills' else path.stem
        title = fields.get('title') or fields.get('name') or name
        description = fields.get('description') or '缺少 description，请补齐 frontmatter。'
        lines.append(f'- [{title}]({os.path.relpath(path, index.parent)}) — {description}')
    block = '<!-- project-memory-entries:start -->\n' + '\n'.join(lines or ['- 暂无条目。']) + '\n<!-- project-memory-entries:end -->'
    return re.sub(r'<!-- project-memory-entries:start -->.*?<!-- project-memory-entries:end -->', lambda _: block, text, flags=re.S)


def plan(target, recursive):
    owners = scopes(target, recursive)
    if not owners:
        if present(target / '.harness'):
            valid_new_scope(target)
        diagnostics = []
        for base, _dirs, _files in walk(target, exclude_installs=True):
            if (recursive or base == target) and is_scope(base) and (base / '.harness/skills/referenced/AGENTS.md').is_file():
                diagnostics.extend(referenced_diagnostics(base))
        return {'operations': [], 'directories': [], 'directoryMap': [], 'private': [], 'diagnostics': diagnostics, 'owners': [], 'legacyOwners': []}
    types = []
    mappings = []
    exact = {}
    diagnostics = []
    directories = []
    for owner in owners:
        safe_ancestors(owner / '.memory', target)
        if not is_scope(owner):
            raise ValueError('legacy-owner-missing-managed-entry: ' + str(owner))
        current = parse(owner)
        if valid_new_scope(owner) and any(not spec.private for spec in current):
            raise ValueError('new-layout-only-allows-private-remnants: ' + str(owner))
        for spec in current:
            if spec.synthetic:
                diagnostics.append({'code': 'legacy-index-missing', 'path': str(spec.indexes[0]), 'detail': 'Official adoption preserved; index reconstructed only from files present on this machine. No missing body data was invented.'})
            mappings.append((spec.directory, owner / spec.relative_target))
            for index in spec.indexes:
                exact[index] = owner / spec.relative_target / 'AGENTS.md'
            types.append((owner, spec))
            if spec.name == 'agent_skills':
                diagnostics.extend(referenced_diagnostics(owner))
    mappings.sort(key=lambda pair: len(pair[0].parts), reverse=True)

    def mapped(path):
        path = lexical(path)
        # Replace the innermost legacy segment, then map the owning parent.
        result = exact.get(path, path)
        if result == path:
            for old, new in mappings:
                if path == old or path.is_relative_to(old):
                    result = new / path.relative_to(old)
                    break
        if result != path:
            return mapped(result)
        return result

    by_source = {}
    index_specs = {index: (owner, spec) for owner, spec in types for index in spec.indexes}
    private = [mapped(owner / spec.relative_target) for owner, spec in types if spec.private]
    for owner in owners:
        for base, dirs, files in walk(owner / '.memory'):
            if base not in owners and present(base / '.memory'):
                raise ValueError('nested-moving-scope-requires-recursive: ' + str(base))
            directories.append(base)
            # A Git boundary inside a moved tree cannot be silently deleted or copied.
            if any((base / name / '.git').exists() for name in os.listdir(base) if (base / name).is_dir() and not (base / name).is_symlink()):
                raise ValueError('nested-git-inside-moving-tree: ' + str(base))
            for filename in files:
                path = base / filename
                by_source[path] = mapped(path)
        by_source[owner / 'AGENTS.md'] = mapped(owner / 'AGENTS.md')
    # Only owned installation entries pointing to explicitly mapped local paths.
    for base, _dirs, files in walk(target, exclude_installs=True):
        if base == target / JOURNAL or (target / JOURNAL) in base.parents:
            continue
        for name in files:
            path = base / name
            if path.is_symlink():
                old_target = lexical(path.parent / os.readlink(path))
                if mapped(old_target) != old_target:
                    by_source[path] = mapped(path)
    for owner in owners:
        installed = owner / '.agents/skills'
        if any(p.is_symlink() for p in (owner / '.agents', installed)):
            continue  # An external installed-directory link is never traversed to write.
        try:
            with os.scandir(installed) as entries:
                links = [Path(e.path) for e in entries if e.is_symlink()]
        except OSError:
            continue  # The referenced inventory already reports an incomplete scan.
        for path in links:
            old_target = lexical(path.parent / os.readlink(path))
            if mapped(old_target) != old_target:
                by_source[path] = mapped(path)
    for index, (owner, spec) in index_specs.items():
        if spec.synthetic:
            by_source[index] = mapped(index)
    operations = []
    destinations = {}
    for source, dest in sorted(by_source.items(), key=lambda pair: str(pair[0])):
        safe_ancestors(source, target)
        safe_ancestors(dest, target)
        before = state(source)
        synthetic = source in index_specs and index_specs[source][1].synthetic
        if synthetic:
            initial = file_state(('# ' + index_specs[source][1].name + '\n\n<!-- project-memory-entries:start -->\n- 暂无条目。\n<!-- project-memory-entries:end -->\n').encode())
        else:
            initial = before
        after = dict(initial)
        if initial['kind'] == 'link':
            link_target = lexical(source.parent / before['data'])
            after['data'] = os.path.relpath(mapped(link_target), dest.parent)
        else:
            data = base64.b64decode(initial['data'])
            if source.suffix == '.md' and '.agents' not in source.relative_to(target).parts:
                try:
                    text = data.decode('utf-8')
                except UnicodeError:
                    text = None
                if text is not None:
                    if source in index_specs:
                        owner, spec = index_specs[source]
                        text = convert_index(text, spec)
                        if spec.name != 'agent_skills' or not referenced_diagnostics(owner):
                            text = rebuild_entries(text, owner, spec, source)
                    if source.name == 'SKILL.md' and any(spec.name == 'skills' and source.parent.parent == spec.directory for _, spec in types):
                        # Only known type fields in an existing header; no serializer.
                        header = re.match(r'\A---\r?\n.*?\r?\n---(?:\r?\n|$)', text, re.S)
                        if header:
                            changed = re.sub(r'(?m)^(\s*(?:edges-type|type):\s*)([\"\']?)skills\2(\s*)$', r'\1\2managed\2\3', header[0])
                            text = changed + text[header.end():]
                    text = rewrite_links(text, source, dest, mapped)
                    if source.name == 'AGENTS.md' and source.parent in owners:
                        for owner, spec in types:
                            if owner != source.parent:
                                continue
                            rel = os.path.relpath(mapped(owner / spec.relative_target / 'AGENTS.md'), dest.parent)
                            if f']({rel})' not in text:
                                marker = '<!-- project-memory-local:end -->'
                                if marker not in text:
                                    raise ValueError('missing-local-adoption-block: ' + str(source))
                                text = text.replace(marker, f'- [{spec.new_name}]({rel}) — {spec.fields.get("description", spec.new_name)}\n' + marker)
                    after = file_state(text.encode(), initial['mode'])
        if source == dest and before == after:
            continue
        if dest in destinations and destinations[dest] != after:
            raise ValueError('target-map-collision: ' + str(dest))
        destinations[dest] = after
        existing = state(dest) if present(dest) else None
        if dest != source and existing is not None and existing != after:
            raise ValueError('target-content-conflict: ' + str(dest))
        operations.append({'source': str(source), 'target': str(dest), 'before': before, 'after': after, 'originalTarget': existing})
    # Ensure all legacy local adoption links are mapped; orphan/missing indexes are conflicts.
    for owner in owners:
        agents = owner / 'AGENTS.md'
        for match in LINK.finditer(agents.read_text()):
            raw = match[2]
            if raw.startswith('.memory/'):
                old = lexical(owner / raw)
                if mapped(old) == old:
                    raise ValueError('unresolved-legacy-adoption: ' + str(old))
    directory_map = [{'source': str(p), 'target': str(mapped(p)), 'mode': stat.S_IMODE(p.stat().st_mode)} for p in set(directories) if p.name != '.memory']
    for item in directory_map:
        dest = Path(item['target'])
        safe_ancestors(dest / 'placeholder', target)
        if present(dest) and not dest.is_dir():
            raise ValueError('directory-target-conflict: ' + str(dest))
    watched = []
    operations_by_source = {op['source']: op for op in operations}
    for owner, spec in types:
        if spec.name != 'agent_skills' or referenced_diagnostics(owner):
            continue
        records = []
        for path in inventory(owner, spec):
            op = operations_by_source.get(str(path.resolve()))
            data = base64.b64decode(op['after']['data']) if op and op['after']['kind'] == 'file' else path.read_bytes()
            records.append({'path': str(mapped(path)), 'sha256': hashlib.sha256(data).hexdigest()})
        watched.append({'owner': str(mapped(owner)), 'records': records})
    return {'watched': watched, 'directoryMap': directory_map, 'legacyOwners': [str(p) for p in owners], 'operations': operations, 'directories': [str(p) for p in sorted(set(directories), key=lambda p: len(p.parts), reverse=True)], 'private': [str(p) for p in private], 'diagnostics': diagnostics, 'owners': [str(mapped(p)) for p in owners]}


def write_state(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    if value['kind'] == 'link':
        if present(path):
            path.unlink()
        path.symlink_to(value['data'])
        return
    fd, temp = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as handle:
            handle.write(base64.b64decode(value['data']))
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temp, value['mode'])
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def save_journal(path, data):
    write_state(path, file_state(json.dumps(data, ensure_ascii=False).encode(), 0o600))


def ignore_before_copy(target, job):
    """Scope-local ignore rules keep journals and copies private even without Git."""
    ignore = target / '.gitignore'
    safe_ancestors(ignore, target)
    if ignore.is_symlink():
        raise ValueError('gitignore-is-symlink')
    existing = ignore.read_text() if ignore.exists() else ''
    rules = ['/' + JOURNAL + '/'] + ['/' + Path(p).relative_to(target).as_posix() + '/' for p in job['private']]
    missing = [r for r in rules if r not in existing.splitlines()]
    if missing:
        mode = stat.S_IMODE(ignore.stat().st_mode) if ignore.exists() else 0o644
        write_state(ignore, file_state((existing.rstrip() + '\n\n# Private Project Memory migration\n' + '\n'.join(missing) + '\n').encode(), mode))
    git = subprocess.run(['git', '-C', str(target), 'rev-parse', '--show-toplevel'], capture_output=True)
    if git.returncode == 0:
        for rel in [JOURNAL + '/journal.json'] + [Path(p).relative_to(target).as_posix() + '/AGENTS.md' for p in job['private']]:
            if subprocess.run(['git', '-C', str(target), 'check-ignore', '-q', '--no-index', rel]).returncode:
                raise ValueError('ignore-coverage-failed: ' + rel)


def validate_source_inventory(job):
    expected_sources = {op['source'] for op in job['operations'] if op['source'] != op['target']}
    expected_dirs = set(job['directories'])
    for owner in job.get('legacyOwners', []):
        for base, _dirs, files in walk(Path(owner) / '.memory'):
            if str(base) not in expected_dirs:
                raise ValueError('source-directory-added-before-retirement: ' + str(base))
            for filename in files:
                if str(base / filename) not in expected_sources:
                    raise ValueError('source-added-before-retirement: ' + str(base / filename))


def preflight_job(target, job):
    validate_source_inventory(job)
    for item in job.get('directoryMap', []):
        dest = Path(item['target'])
        safe_ancestors(dest / 'placeholder', target)
        if present(dest) and not dest.is_dir():
            raise ValueError('directory-target-conflict: ' + str(dest))
    for op in job['operations']:
        source, dest = Path(op['source']), Path(op['target'])
        safe_ancestors(source, target)
        safe_ancestors(dest, target)
        actual_source = state(source)
        if source == dest:
            if actual_source not in (op['before'], op['after']):
                raise ValueError('resume-source-edited: ' + str(source))
        elif actual_source is not None and actual_source != op['before']:
            raise ValueError('resume-source-edited: ' + str(source))
        actual_target = state(dest)
        allowed = (op['originalTarget'], op['after']) if source != dest else (op['before'], op['after'])
        if actual_target not in allowed:
            raise ValueError('resume-target-edited: ' + str(dest))
        if op['before'] is not None and actual_source is None and actual_target != op['after']:
            raise ValueError('resume-source-and-target-missing: ' + str(source))
    for path in job['private']:
        safe_ancestors(Path(path) / 'AGENTS.md', target)
    ignore = target / '.gitignore'
    if present(ignore) and (ignore.is_symlink() or not ignore.is_file()):
        raise ValueError('unsafe-gitignore')


def validate(target, job):
    """No old byte is deleted until copies, indexes and ignore coverage validate."""
    preflight_job(target, job)
    from types import SimpleNamespace
    for watch in job.get('watched', []):
        spec = SimpleNamespace(name='agent_skills', format='skills')
        records = [{'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in inventory(Path(watch['owner']), spec)]
        if records != watch['records']:
            raise ValueError('referenced-source-changed-before-retirement: ' + watch['owner'])
    validate_source_inventory(job)
    for op in job['operations']:
        dest = Path(op['target'])
        if state(dest) != op['after']:
            raise ValueError('copy-validation-failed: ' + str(dest))
    for owner in job['owners']:
        specs = layer_type_specs(Path(owner))
        text = (Path(owner) / 'AGENTS.md').read_text()
        for spec in specs:
            if f']({spec.index_file})' not in text:
                raise ValueError('unregistered-migrated-type: ' + spec.index_file)
            index = Path(owner) / spec.index_file
            if not index.is_file():
                raise ValueError('missing-migrated-index: ' + spec.index_file)
            for match in LINK.finditer(index.read_text()):
                raw = match[2].split('#')[0]
                if not raw or re.match(r'\w+:|/', raw):
                    continue
                linked = lexical(index.parent / unquote(raw))
                # External/source inventories are diagnosed separately; local mapped
                # destinations must be present before retirement.
                if any(str(linked) == op['target'] for op in job['operations']) and not present(linked):
                    raise ValueError('missing-mapped-reference: ' + str(linked))


def migrate(target, root=None, recursive=False, dry_run=False):
    target = Path(target).expanduser().resolve()
    if not target.is_dir():
        raise ValueError('target-is-not-directory')
    resolve_root(target, str(root) if root else None)
    journal_dir = target / JOURNAL
    journal = journal_dir / 'journal.json'
    if (journal_dir.exists() and (not journal_dir.is_dir() or not journal.is_file())) or journal_dir.is_symlink() or journal.is_symlink():
        raise ValueError('unsafe-journal-path')
    job = None
    stored = None
    if journal.exists():
        stored = json.loads(journal.read_text())
        if stored.get('target') != str(target):
            raise ValueError('journal-target-mismatch')
        if stored.get('phase') != 'done':
            if stored.get('recursive') != recursive:
                raise ValueError('resume-with-original-recursive-option')
            job = stored
    if job is None:
        job = plan(target, recursive)
        if stored and not job['operations']:
            job['diagnostics'].extend(d for d in stored.get('diagnostics', []) if d['code'] != 'source-scan-incomplete')
        job.update(target=str(target), recursive=recursive, phase='planned')
    preflight_job(target, job)
    output = {'ok': True, 'status': 'dry-run' if dry_run else ('unchanged-incomplete' if job['diagnostics'] else 'unchanged'), 'complete': not bool(job['diagnostics']), 'pathMap': [{'source': op['source'], 'target': op['target']} for op in job['operations']], 'directoryMap': [{'source': op['source'], 'target': op['target']} for op in job.get('directoryMap', [])], 'diagnostics': job['diagnostics']}
    if dry_run or not job['operations']:
        return output
    ignore_before_copy(target, job)
    journal_dir.mkdir(mode=0o700, exist_ok=True)
    journal_dir.chmod(0o700)
    save_journal(journal, job)
    for item in sorted(job.get('directoryMap', []), key=lambda item: len(Path(item['target']).parts)):
        dest = Path(item['target'])
        if not dest.exists():
            dest.mkdir(parents=True, mode=item['mode'])
            dest.chmod(item['mode'])
    for op in job['operations']:
        dest = Path(op['target'])
        if state(dest) != op['after']:
            write_state(dest, op['after'])
    job['phase'] = 'copied'
    save_journal(journal, job)
    validate(target, job)
    job['phase'] = 'validated'
    save_journal(journal, job)
    for op in job['operations']:
        source = Path(op['source'])
        if source != Path(op['target']) and present(source):
            if state(source) != op['before']:
                raise ValueError('source-edited-before-retirement: ' + str(source))
            source.unlink()
    for raw in job['directories']:
        directory = Path(raw)
        if directory.is_dir() and not directory.is_symlink():
            directory.rmdir()
    job['phase'] = 'done'
    save_journal(journal, job)
    output['status'] = 'migrated-incomplete' if job['diagnostics'] else 'migrated'
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target-dir', required=True)
    parser.add_argument('--root-dir')
    parser.add_argument('--recursive', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    try:
        result = migrate(args.target_dir, args.root_dir, args.recursive, args.dry_run)
    except (OSError, ValueError, RuntimeError) as error:
        print(json.dumps({'ok': False, 'status': 'conflict-or-incomplete', 'error': str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
