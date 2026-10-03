#!/usr/bin/env python3
"""Reviewed Edges instance migration. Generic Project Memory owns format conversion.

All writes are bounded to --worktree. The private journal stores the planned byte
states, so interrupted runs resume without recalculating from a half-moved tree.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'extensions/skills/project-memory-migrate/scripts'))
import migrate as generic

JOURNAL = '.recursive-layout-migration'
OWNER_MAP = {'.': '.', 'extensions': '.', 'extensions/skills/project-memory-init': '.',
             'shared-extensions': '.', 'knowledge/tasks': '.', 'knowledge/notes': '.',
             'evaluation': '.harness/evaluation', 'knowledge/teaching': 'teaching'}
DIRECTORIES = {'knowledge/projects': 'projects', 'knowledge/teaching': 'teaching',
               'evaluation': '.harness/evaluation', 'observation': '.harness/observation',
               'knowledge/tasks': '.harness/tasks'}


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decode(value):
    return base64.b64decode(value['data']).decode()


def private_path(path):
    return '.memory/users' in path or '.harness/memory/users' in path or path.endswith('/.memory/USER.md')


def block(text, name, body=None):
    pattern = rf'<!-- project-memory-{name}:start -->.*?<!-- project-memory-{name}:end -->'
    replacement = '' if body is None else f'<!-- project-memory-{name}:start -->\n{body}\n<!-- project-memory-{name}:end -->'
    return re.sub(pattern, lambda _: replacement, text, flags=re.S)


def strip_scope(text):
    for name in ('local', 'children'):
        text = block(text, name)
    return text.replace('<!-- project-memory:start -->', '').replace('<!-- project-memory:end -->', '')


def merge_index_metadata(left, right):
    """Union compatible fields without interpreting or discarding unknown values.

    Values (including indented YAML structures) remain raw text. Different values
    for the same key require review instead of silently choosing an owner.
    """
    type_pattern = re.compile(r'<!-- project-memory-type:start -->\n(.*?)<!-- project-memory-type:end -->', re.S)
    front_pattern = re.compile(r'\A\s*---\r?\n(.*?)\r?\n---(?:\r?\n|$)', re.S)

    def extract(text):
        type_match = type_pattern.search(text)
        type_fields = type_match[1] if type_match else ''
        body = type_pattern.sub('', text, count=1)
        front_match = front_pattern.match(body)
        front_fields = front_match[1] + '\n' if front_match else ''
        if front_match:
            body = body[front_match.end():]
        return type_fields, front_fields, body.lstrip('\r\n')

    def union_fields(first, second):
        fields = {}
        comments = []
        for document in (first, second):
            matches = list(re.finditer(r'(?m)^([A-Za-z_][A-Za-z0-9_.-]*):', document))
            preamble = document[:matches[0].start()] if matches else document
            if any(line.strip() and not line.lstrip().startswith('#') for line in preamble.splitlines()):
                raise ValueError('index-metadata-structure-needs-review')
            if preamble.strip() and preamble not in comments:
                comments.append(preamble)
            local_keys = set()
            for number, match in enumerate(matches):
                key = match[1]
                value = document[match.start():matches[number+1].start() if number+1<len(matches) else len(document)].rstrip('\r\n')
                if key in local_keys or (key in fields and fields[key] != value):
                    raise ValueError('index-metadata-conflict: ' + key)
                local_keys.add(key)
                fields.setdefault(key, value)
        return ''.join(comments) + ''.join(value+'\n' for value in fields.values())

    left_type, left_front, left_body = extract(left)
    right_type, right_front, right_body = extract(right)
    type_fields = union_fields(left_type, right_type)
    front_fields = union_fields(left_front, right_front)
    headers = ('---\n'+front_fields+'---\n\n') if front_fields else ''
    if type_fields:
        headers += '<!-- project-memory-type:start -->\n'+type_fields+'<!-- project-memory-type:end -->\n\n'
    return headers+left_body, right_body


def make_plan(root, manifest):
    owners = manifest.get('privateOwnerMap', OWNER_MAP)
    if owners != OWNER_MAP:
        raise ValueError('private-owner-map-differs-from-reviewed-instance')
    legacy = []
    for base, dirs, _ in generic.walk(root, exclude_installs=True):
        dirs[:] = [d for d in dirs if d not in {JOURNAL, '.superpowers'}]
        if '.memory' in dirs:
            owner = base.relative_to(root).as_posix()
            if owner not in owners:
                raise ValueError('unknown-legacy-owner: ' + owner)
            legacy.append(owner)
    ignore = root / '.gitignore'
    generic.safe_ancestors(ignore, root)
    if ignore.is_symlink() or (ignore.exists() and not ignore.is_file()):
        raise ValueError('unsafe-gitignore')
    full_legacy = (root / '.memory').is_dir() and '](.memory/' in (root / 'AGENTS.md').read_text()
    memory = generic.plan(root, True) if full_legacy else {'operations': [], 'diagnostics': [], 'directoryMap': [], 'private': []}
    exact = {}
    expected = []
    for group in ('tasks', 'localMemoryRecords', 'taskAssets'):
        for item in manifest.get(group, []):
            exact[item['source']] = item['target']
            expected.append(item)
            if group == 'tasks' and (item.get('sidecar') or {}).get('sha256'):
                exact[item['sidecar']['source']] = item['sidecar']['target']
                expected.append(item['sidecar'])
    public_legacy = any((root/item['source']).exists() for item in expected)
    for item in expected if public_legacy else []:
        source = root / item['source']
        if source.exists() and sha(source) != item['sha256']:
            raise ValueError('reviewed-source-hash-mismatch: ' + item['source'])
        if not source.exists() and not (root / item['target']).exists():
            raise ValueError('reviewed-source-and-target-missing: ' + item['source'])
    for rel, digest in manifest.get('protectedPostHashes', {}).items():
        if sha(root / rel) != digest:
            raise ValueError('protected-post-hash-mismatch: ' + rel)

    remnant_type_map = {}

    def mapped(path):
        path = generic.lexical(path)
        if not path.is_relative_to(root):
            return path
        rel = path.relative_to(root).as_posix()
        if rel in exact:
            return root / exact[rel]
        for source, target in remnant_type_map.items():
            if path == source or path.is_relative_to(source):
                return target / path.relative_to(source)
        for owner in sorted(owners, key=len, reverse=True):
            prefix = (owner + '/' if owner != '.' else '')
            for old, new in [('.memory/skills', '.harness/skills/managed'), ('.memory/agent_skills', '.harness/skills/referenced'), ('.memory', '.harness/memory'), ('.harness', '.harness')]:
                source = prefix + old
                if rel == source or rel.startswith(source + '/'):
                    tail = rel[len(source):]
                    return root / owners[owner] / (new + tail)
        for old, new in DIRECTORIES.items():
            if rel == old or rel.startswith(old + '/'):
                return root / (new + rel[len(old):])
        return path

    # Generic intermediate targets must also honor individually reviewed renames.
    intermediate = {}
    for op in memory['operations']:
        intermediate[op['target']] = mapped(Path(op['source']))
    def remapped(path):
        return intermediate.get(str(path), mapped(path))

    for rel in manifest.get('protectedPostHashes', {}):
        path = root / rel
        if generic.rewrite_links(path.read_text(), path, path, mapped) != path.read_text():
            raise ValueError('protected-post-link-needs-human: ' + rel)

    operations = {}
    sources = set()
    def add(source, target, after, before=None):
        generic.safe_ancestors(source, root); generic.safe_ancestors(target, root)
        if before is None:
            before = generic.state(source)
        if source == target and before == after:
            return
        key = str(target)
        if key in operations:
            old = operations[key]
            if source == Path(old['source']):
                old['after'] = after; return
            if source.name == target.name == 'AGENTS.md' and '.memory' in source.parts:
                # Preserve every authored introduction, including private ones.
                if private_path(str(source)):
                    raise ValueError('private-index-collision: ' + str(source.relative_to(root)))
                left, right = decode(old['after']), decode(after)
                left, right = merge_index_metadata(left, right)
                pattern = r'<!-- project-memory-entries:start -->(.*?)<!-- project-memory-entries:end -->'
                lines = []
                for document in (left, right):
                    match = re.search(pattern, document, flags=re.S)
                    if match:
                        lines.extend(line for line in match[1].splitlines() if line.startswith('- [') and '](' in line)
                lines = sorted(set(lines), key=lambda line: line.split('](', 1)[1])
                entries = '<!-- project-memory-entries:start -->\n' + '\n'.join(lines or ['- 暂无条目。']) + '\n<!-- project-memory-entries:end -->'
                left = re.sub(pattern, lambda _: entries, left, flags=re.S)
                right = re.sub(pattern, '', right, flags=re.S)
                old['after'] = generic.file_state((left.rstrip() + '\n\n## 原模块：' + source.parent.parent.parent.relative_to(root).as_posix() + '\n\n' + right.strip() + '\n').encode())
                old.setdefault('retire', []).append({'source':str(source), 'before':before})
                sources.add(str(source)); return
            raise ValueError('mapped-target-collision: ' + str(target.relative_to(root)))
        current = generic.state(target)
        if source != target and current is not None and current != after:
            raise ValueError('target-content-conflict: ' + str(target.relative_to(root)))
        operations[key] = {'source':str(source), 'target':str(target), 'before':before, 'after':after, 'originalTarget':current}
        sources.add(str(source))

    for op in sorted(memory['operations'], key=lambda op: (len(Path(op['source']).parts), op['source'])):
        source = Path(op['source']); dest = mapped(source)
        after = op['after']
        if after['kind'] == 'file' and source.suffix == '.md':
            text = generic.rewrite_links(decode(after), Path(op['target']), dest, remapped)
            if source.name == 'AGENTS.md' and source.parent.relative_to(root).as_posix() in owners and owners[source.parent.relative_to(root).as_posix()] == '.' and source.parent != root:
                text = strip_scope(text)
            # Do not synthesize adopted users or referenced indexes in abolished module scopes.
            if op['before'] is None and source.parent.parent.parent != root and owners.get(source.parent.parent.parent.relative_to(root).as_posix()) == '.':
                continue
            after = generic.file_state(text.encode(), after['mode'])
        add(source, dest, after, op['before'])

    # A clone that pulled the public migration can still have ignored legacy users.
    # Do not call generic owner discovery: removed module scopes must stay removed.
    if not full_legacy:
        private_specs = {}
        for owner in legacy:
            old = root / owner / '.memory'
            indexes = list(old.glob('*/AGENTS.md')) + list(old.glob('*.md'))
            specs = generic.parse(root / owner) if indexes else []
            private_specs[owner] = specs
            for spec in specs:
                if not spec.private:
                    raise ValueError('unreviewed-public-remnant: ' + owner + '/' + spec.name)
                converted = generic.parse_type_meta(generic.convert_index('', spec))
                if converted.module != spec.module:
                    raise ValueError('private-type-module-conflict: ' + spec.name)
                memory['private'].append(str(root / owner / spec.relative_target))
                target_dir = root / owners[owner] / spec.relative_target
                remnant_type_map[spec.directory] = target_dir
                for index in spec.indexes:
                    exact[index.relative_to(root).as_posix()] = (target_dir / 'AGENTS.md').relative_to(root).as_posix()
        for owner in legacy:
            old = root / owner / '.memory'
            specs = private_specs[owner]
            for base, dirs, files in generic.walk(old, owned=True):
                if base != old:
                    memory['directoryMap'].append({'source': str(base), 'target': str(mapped(base)), 'mode': stat.S_IMODE(base.stat().st_mode)})
                for name in files:
                    source = base / name
                    spec = next((item for item in specs if source in item.indexes or source.is_relative_to(item.directory)), None)
                    if spec is None and source.relative_to(old).parts[0] != 'users':
                        raise ValueError('unreviewed-private-type-or-public-remnant: ' + source.relative_to(root).as_posix())
                    target = mapped(source)
                    if spec is None and not (root / owners[owner] / '.harness/memory/users/AGENTS.md').is_file():
                        raise ValueError('private-index-missing: ' + owner + '/.memory/users/AGENTS.md')
                    after = generic.state(source)
                    if after['kind'] == 'file' and source.suffix == '.md':
                        try:
                            text = decode(after)
                        except UnicodeError:
                            pass  # Binary private assets keep their bytes and mode.
                        else:
                            if spec and source in spec.indexes:
                                text = generic.convert_index(text, spec)
                            text = generic.rewrite_links(text, source, target, mapped)
                            after = generic.file_state(text.encode(), after['mode'])
                    elif after['kind'] == 'link':
                        link_target = generic.lexical(source.parent / after['data'])
                        after = dict(after, data=os.path.relpath(mapped(link_target), target.parent))
                    add(source, target, after)

    # Enumerate actual moving trees (including untracked/ignored assets), excluding
    # repositories, caches and installations. Tracked files elsewhere get link repair.
    tracked = set(git(root, 'ls-files', '-z').split('\0'))
    candidates = {root / rel for rel in tracked if rel and (root / rel).is_file() and not (root / rel).is_symlink()}
    for old in DIRECTORIES:
        if not (root / old).is_dir():
            continue
        for base, dirs, files in generic.walk(root / old):
            dirs[:] = [d for d in dirs if d not in {'.cache', '_site', '.memory', '.harness'}]
            candidates.update(base / f for f in files)
    for source in sorted(candidates):
        rel = source.relative_to(root).as_posix()
        if str(source) in sources or rel.startswith(('knowledge/posts/', '.agents/', '.claude/', '.superpowers/')) or source.name == '.git' or source.is_dir():
            continue
        dest = mapped(source)
        before = generic.state(source); after = before
        if source.suffix == '.md' and before['kind'] == 'file':
            text = generic.rewrite_links(decode(before), source, dest, mapped)
            if source.name == 'AGENTS.md' and source.parent.relative_to(root).as_posix() in owners and source.parent != root and owners[source.parent.relative_to(root).as_posix()] == '.':
                text = strip_scope(text)
            after = generic.file_state(text.encode(), before['mode'])
        elif before['kind'] == 'link':
            after = dict(before, data=os.path.relpath(mapped(generic.lexical(source.parent / before['data'])), dest.parent))
        add(source, dest, after, before)

    # Split boards retain manual instructions and Project metadata on both sides.
    domain_projects = {Path(i['target']).parts[1] for i in manifest.get('tasks', []) if i['target'].startswith('tasks/')}
    for rel in ['AGENTS.md', *[p + '/AGENTS.md' for p in sorted(domain_projects)]]:
        source = root / 'knowledge/tasks' / rel
        if source.is_file():
            dest = root / 'tasks' / rel
            text = generic.rewrite_links(source.read_text(), source, dest, mapped)
            if rel == 'AGENTS.md':
                text = strip_scope(text)
                text = re.sub(r'^- \[.*?\]\(([^)]+)/AGENTS.md\).*\n', lambda m: m[0] if m[1] in domain_projects else '', text, flags=re.M)
            # This deliberate metadata copy is not a second task source.
            add(dest, dest, generic.file_state(text.encode()))

    def edit(rel, transform):
        target = root / rel
        op = operations.get(str(target))
        old = decode(op['after']) if op else (target.read_text() if target.is_file() else '')
        value = generic.file_state(transform(old).encode())
        if op:
            op['after'] = value
        else:
            add(target, target, value)

    if full_legacy or (root / 'knowledge/tasks').exists():
        def root_entry(text):
            text = text.replace('，那是唯一真理源。', '；AGENTS.md 组织入口发现，各规范正文按职责保持单一真源。')
            children = '## 下层作用域\n\n- [.harness/evaluation/AGENTS.md](.harness/evaluation/AGENTS.md) — 评测工作区及其独立验证责任。\n- [teaching/AGENTS.md](teaching/AGENTS.md) — 教学与学习状态。'
            text = block(text, 'children', children)
            nav = '\n## 工作与模块入口\n\n'
            for path, label in [('tasks/AGENTS.md','领域任务'),('.harness/tasks/AGENTS.md','根维护任务'),('.harness/evaluation/AGENTS.md','评测'),('.harness/observation/AGENTS.md','观测职责与资料'),('extensions/AGENTS.md','对外能力实现约束'),('extensions/skills/project-memory-init/AGENTS.md','Project Memory 实现约束'),('shared-extensions/AGENTS.md','共享扩展约束'),('knowledge/notes/AGENTS.md','笔记规范'),('README.md','目录与内容说明'),('CONTEXT.md','领域术语'),('docs/adr/','架构决策')]:
                nav += f'- [{label}]({path}) — {label}入口。\n'
            return text.rstrip() + '\n' + nav
        edit('AGENTS.md', root_entry)
        observation = root / 'observation/README.md'
        if observation.exists():
            edit('.harness/observation/AGENTS.md', lambda _: generic.rewrite_links(observation.read_text(), observation, root/'.harness/observation/AGENTS.md', mapped))
        edit('.gitmodules', lambda text: text.replace('path = evaluation/third_party/locomo', 'path = .harness/evaluation/third_party/locomo'))
    pin = manifest.get('gitlink')
    gitlink_move = None
    if pin:
        indexed = git(root, 'ls-files', '--stage', pin['source'], pin['target'])
        if pin['sha'] not in indexed:
            raise ValueError('gitlink-pin-mismatch')
        if '\t' + pin['source'] in indexed:
            gitlink_move = pin
    directory_targets = {}
    for item in memory['directoryMap']:
        source, target = Path(item['source']), mapped(Path(item['source']))
        generic.safe_ancestors(target / 'placeholder', root)
        if generic.present(target) and not target.is_dir():
            raise ValueError('directory-target-conflict: ' + str(target.relative_to(root)))
        before_mode = stat.S_IMODE(target.stat().st_mode) if target.exists() else None
        desired_mode = item['mode'] if before_mode is None else item['mode'] & before_mode
        key = str(target)
        if key not in directory_targets:
            directory_targets[key] = {'target': key, 'mode': desired_mode, 'beforeMode': before_mode, 'sources': []}
        directory_targets[key]['mode'] &= desired_mode
        directory_targets[key]['sources'].append({'source': str(source), 'mode': item['mode']})
    private_dirs = [str(mapped(Path(path))) for path in memory['private']]
    # Flat legacy private indexes and synthetic official indexes have no source
    # type directory. Establish a private destination before their first copy.
    for path in private_dirs:
        if path in directory_targets:
            continue
        target = Path(path)
        generic.safe_ancestors(target / 'placeholder', root)
        if generic.present(target) and not target.is_dir():
            raise ValueError('directory-target-conflict: ' + str(target.relative_to(root)))
        before_mode = stat.S_IMODE(target.stat().st_mode) if target.exists() else None
        directory_targets[path] = {'target': path, 'mode': 0o700 if before_mode is None else before_mode & 0o700, 'beforeMode': before_mode, 'sources': []}
    directory_map = list(directory_targets.values())
    watched_sources = sorted(sources)
    return {'directories': directory_map, 'private': private_dirs, 'watchedSources': watched_sources, 'operations':list(operations.values()), 'diagnostics':memory['diagnostics'], 'gitlink':gitlink_move,
            'legacyOwners':legacy, 'protected':manifest.get('protectedPostHashes', {}), 'phase':'planned'}


def check_job(root, job):
    for op in job['operations']:
        source, dest = Path(op['source']), Path(op['target'])
        generic.safe_ancestors(source, root); generic.safe_ancestors(dest, root)
        actual = generic.state(dest)
        if actual not in (op['originalTarget'], op['after']):
            raise ValueError('resume-target-edited: ' + str(dest.relative_to(root)))
        for item in [op, *op.get('retire', [])]:
            old = Path(item['source']); current = generic.state(old)
            allowed = (item['before'], None) if old != dest else (item['before'], op['after'])
            if current not in allowed:
                raise ValueError('resume-source-edited: ' + str(old.relative_to(root)))
            if old != dest and current is None and actual != op['after'] and item['before'] is not None:
                raise ValueError('resume-both-missing: ' + str(old.relative_to(root)))
    for item in job.get('directories', []):
        target = Path(item['target'])
        generic.safe_ancestors(target / 'placeholder', root)
        if generic.present(target) and not target.is_dir():
            raise ValueError('directory-target-conflict: ' + str(target.relative_to(root)))
        actual_mode = stat.S_IMODE(target.stat().st_mode) if target.exists() else None
        if actual_mode not in (item.get('beforeMode'), item['mode']):
            raise ValueError('resume-directory-mode-changed: ' + str(target.relative_to(root)))
        for source in item.get('sources', []):
            path = Path(source['source'])
            if path.exists() and stat.S_IMODE(path.stat().st_mode) != source['mode']:
                raise ValueError('resume-source-directory-mode-changed: ' + str(path.relative_to(root)))
    watched = set(job.get('watchedSources', []))
    for owner in job.get('legacyOwners', []):
        old = root / owner / '.memory'
        if not old.exists(): continue
        for base, dirs, files in generic.walk(old, owned=True):
            for name in files:
                if str(base / name) not in watched:
                    raise ValueError('legacy-source-added-after-preflight: ' + str((base/name).relative_to(root)))
    for rel, digest in job['protected'].items():
        if sha(root/rel) != digest: raise ValueError('protected-post-hash-mismatch: ' + rel)


def validate_copies(root, job):
    """Validate actual final index targets and states before retiring any source."""
    destinations = {Path(op['target']) for op in job['operations']}
    for item in job.get('directories', []):
        dest = Path(item['target'])
        if not dest.is_dir() or stat.S_IMODE(dest.stat().st_mode) != item['mode']:
            raise ValueError('directory-mode-validation-failed: ' + str(dest.relative_to(root)))
    for op in job['operations']:
        dest = Path(op['target'])
        if generic.state(dest) != op['after']:
            raise ValueError('copy-validation-failed: ' + str(dest.relative_to(root)))
        if dest.name == 'AGENTS.md' and op['after']['kind'] == 'file':
            for match in generic.LINK.finditer(decode(op['after'])):
                raw = match[2].split('#')[0]
                if not raw or re.match(r'\w+:|/', raw): continue
                from urllib.parse import unquote
                linked = generic.lexical(dest.parent / unquote(raw))
                if linked in destinations and not generic.present(linked):
                    raise ValueError('missing-mapped-index-link: ' + str(dest.relative_to(root)))
    for scope in (root, root/'teaching', root/'.harness/evaluation'):
        if not (scope/'AGENTS.md').exists(): continue
        for spec in generic.layer_type_specs(scope):
            index=scope/spec.index_file
            if not index.is_file():
                raise ValueError('missing-final-type-index: ' + str(index.relative_to(root)))
    for op in job['operations']:
        if private_path(op['target']):
            if subprocess.run(['git','-C',str(root),'check-ignore','-q','--no-index',op['target']]).returncode:
                raise ValueError('private-ignore-coverage-failed')


def run(root, manifest, apply):
    root = root.expanduser().resolve()
    if Path(git(root, 'rev-parse', '--show-toplevel')).resolve() != root:
        raise ValueError('worktree-must-be-explicit-git-root')
    journal = root / JOURNAL / 'journal.json'
    generic.safe_ancestors(journal, root)
    stored = json.loads(journal.read_text()) if journal.exists() else None
    if stored and stored['root'] != str(root): raise ValueError('journal-root-mismatch')
    job = stored if stored and stored['phase'] != 'done' else make_plan(root, manifest)
    job['root'] = str(root)
    check_job(root, job)
    public = [{'source':str(Path(op['source']).relative_to(root)), 'target':str(Path(op['target']).relative_to(root))} for op in job['operations'] if not private_path(op['source']) and not private_path(op['target'])]
    current_diagnostics = []
    for scope in (root, root / 'teaching', root / '.harness/evaluation'):
        if (scope / '.harness/skills/referenced/AGENTS.md').is_file():
            current_diagnostics.extend(generic.referenced_diagnostics(scope))
    result = {'status':'dry-run' if not apply else 'unchanged', 'operations':len(job['operations']), 'publicPathMap':public,
              'privateOperationCount':len(job['operations'])-len(public), 'diagnostics':job['diagnostics'] or current_diagnostics, 'complete':not bool(job['diagnostics'] or current_diagnostics)}
    if not apply or (not job['operations'] and not job['gitlink'] and not job.get('directories')): return result
    ignore = root/'.gitignore'
    text = ignore.read_text() if ignore.exists() else ''
    rules = ['**/' + JOURNAL + '/', '**/.harness/memory/users/', '**/.memory/users/'] + ['/' + Path(p).relative_to(root).as_posix() + '/' for p in job.get('private', [])]
    for rule in rules:
        if rule not in text.splitlines(): text += '\n' + rule + '\n'
    ignore.write_text(text)
    journal.parent.mkdir(mode=0o700, exist_ok=True)
    generic.save_journal(journal, job)
    for item in sorted(job.get('directories', []), key=lambda value: len(Path(value['target']).parts)):
        dest = Path(item['target'])
        generic.safe_ancestors(dest / 'placeholder', root)
        if not dest.exists():
            dest.mkdir(parents=True, mode=item['mode'])
        dest.chmod(item['mode'])
    for op in job['operations']:
        if generic.state(Path(op['target'])) != op['after']:
            generic.write_state(Path(op['target']), op['after'])
    pin = job['gitlink']
    if pin and '\t'+pin['source'] in git(root,'ls-files','--stage',pin['source']):
        old, new = root/pin['source'], root/pin['target']
        new.parent.mkdir(parents=True, exist_ok=True)
        if old.is_dir() and (old/'.git').exists():
            git(root,'mv',pin['source'],pin['target'])
        else:
            # Git needs the uninitialized submodule's empty worktree directory;
            # otherwise a later git add -A interprets the gitlink as deleted.
            new.mkdir(exist_ok=True)
            git(root,'update-index','--add','--cacheinfo','160000,'+pin['sha']+','+pin['target'])
            git(root,'update-index','--force-remove',pin['source'])
            if old.is_dir(): old.rmdir()
    job['phase']='copied'; generic.save_journal(journal,job)
    check_job(root,job)
    validate_copies(root, job)
    for op in job['operations']:
        for item in [op,*op.get('retire',[])]:
            source=Path(item['source'])
            if source != Path(op['target']) and generic.present(source): source.unlink()
    # Retire only empty legacy directories; unplanned files remain visible.
    for rel in [*DIRECTORIES, *[(o+'/' if o!='.' else '')+'.memory' for o in job['legacyOwners']]]:
        old=root/rel
        if old.is_dir():
            for base, dirs, files in os.walk(old,topdown=False,followlinks=False):
                path=Path(base)
                if not list(path.iterdir()): path.rmdir()
    job['phase']='done'; generic.save_journal(journal,job)
    result['status']='migrated'
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--worktree',type=Path,required=True)
    parser.add_argument('--manifest',default='docs/superpowers/plans/2026-10-03-recursive-scope-ownership.json')
    mode=parser.add_mutually_exclusive_group(required=True); mode.add_argument('--dry-run',action='store_true'); mode.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    try:
        manifest=json.loads((args.worktree/args.manifest).read_text())
        print(json.dumps(run(args.worktree,manifest,args.apply),ensure_ascii=False,indent=2))
    except (ValueError,OSError,subprocess.CalledProcessError) as error:
        print(str(error),file=sys.stderr); return 1
    return 0

if __name__=='__main__': sys.exit(main())
