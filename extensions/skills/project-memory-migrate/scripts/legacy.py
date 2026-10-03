"""Legacy parsing is deliberately confined to the one-shot migrator."""
from dataclasses import dataclass
from pathlib import Path
import re

START = '<!-- project-memory-type:start -->'
END = '<!-- project-memory-type:end -->'
ENTRIES = '<!-- project-memory-entries:start -->'
BUILTINS = {'user': 'users', 'feedback': 'feedbacks', 'project': 'projects', 'reference': 'references', 'skills': 'skills', 'agent_skills': 'agent_skills'}
RENAMES = {'skills': 'managed', 'agent_skills': 'referenced'}

@dataclass
class LegacyType:
    name: str
    directory: Path
    indexes: list
    module: str
    private: bool
    writable: bool
    format: str
    fields: dict
    synthetic: bool = False

    @property
    def new_name(self):
        return RENAMES.get(self.name, self.name)

    @property
    def relative_target(self):
        dirname = self.new_name if self.name in RENAMES else self.directory.name
        return Path('.harness') / self.module / dirname


def metadata(text):
    if (START in text) != (END in text):
        raise ValueError('malformed-type-metadata')
    match = re.search(re.escape(START) + r'\n(.*?)' + re.escape(END), text, re.S)
    if not match:
        return {}
    result = {}
    for line in match[1].splitlines():
        key, sep, value = line.partition(':')
        if sep:
            if key.strip() in result:
                raise ValueError('duplicate-type-field')
            result[key.strip()] = value.strip()
    return result


def parse(scope):
    memory = scope / '.memory'
    if memory.is_symlink():
        raise ValueError('legacy-memory-is-symlink')
    if not memory.is_dir():
        raise ValueError('legacy-memory-is-not-directory')
    groups = {}
    for path in sorted(memory.iterdir()):
        if path.is_symlink():
            raise ValueError('legacy-type-is-symlink: ' + str(path))
        if path.is_dir():
            candidates = [path / 'AGENTS.md'] if (path / 'AGENTS.md').is_file() else []
            guessed = next((n for n, d in BUILTINS.items() if d == path.name), path.name)
        elif re.fullmatch('[A-Z][A-Z0-9_]*.md', path.name):
            candidates = [path]
            guessed = path.stem.lower()
        else:
            raise ValueError('unclassified-legacy-path: ' + str(path))
        for index in candidates:
            if index.is_symlink():
                raise ValueError('legacy-index-is-symlink: ' + str(index))
            text = index.read_text()
            if ENTRIES not in text or '<!-- project-memory-entries:end -->' not in text:
                raise ValueError('missing-entry-block: ' + str(index))
            fields = metadata(text)
            name = fields.get('name', guessed)
            if not re.fullmatch('[a-z][a-z0-9]*(?:_[a-z0-9]+)*', name):
                raise ValueError('invalid-type-name')
            if name in BUILTINS and name != guessed:
                raise ValueError('official-type-identity-path-conflict: ' + name)
            if name in {'managed', 'referenced'}:
                raise ValueError('new-builtin-name-collision: ' + name)
            if name not in BUILTINS and not {'writable', 'gitignore'} <= fields.keys():
                raise ValueError('ambiguous-custom-privileges: ' + name)
            for flag in ('writable', 'gitignore', 'index-only'):
                if flag in fields and fields[flag] not in {'true', 'false'}:
                    raise ValueError('invalid-type-flag: ' + flag)
            writable = fields.get('writable', 'false' if name == 'agent_skills' else 'true') == 'true'
            if 'index-only' in fields and writable == (fields['index-only'] == 'true'):
                raise ValueError('conflicting-index-only-flag')
            private = fields.get('gitignore', 'true' if name == 'user' else 'false') == 'true'
            fmt = fields.get('format', 'skills' if name in RENAMES else 'ordinary')
            if fmt not in {'ordinary', 'skills'}:
                raise ValueError('unknown-type-format')
            if name == 'user' and not private:
                raise ValueError('user-must-remain-private')
            if name == 'skills' and (not writable or fmt != 'skills'):
                raise ValueError('managed-requires-writable-skills')
            if name == 'agent_skills' and (writable or fmt != 'skills'):
                raise ValueError('referenced-requires-index-only-skills')
            default_module = 'skills' if name in RENAMES else 'memory'
            module = fields.get('module', default_module)
            if module not in {'memory', 'skills'}:
                raise ValueError('unsupported-legacy-module')
            if name in BUILTINS and (module != default_module or (name not in RENAMES and fmt != 'ordinary')):
                raise ValueError('ambiguous-legacy-module')
            dirname = BUILTINS.get(name, name if name.endswith('s') else name + 's')
            directory = memory / (path.name if path.is_dir() else dirname)
            current = LegacyType(name, directory, [index], module, private, writable, fmt, fields)
            if name in groups:
                previous = groups[name]
                if previous.directory != directory or previous.fields != fields or previous.indexes[0].read_bytes() != index.read_bytes():
                    raise ValueError('legacy-index-conflict: ' + name)
                previous.indexes.append(index)
            else:
                groups[name] = current
    # Official adoption is deterministic even when Git intentionally omitted
    # a local private index. It carries no evidence of nonexistent body records.
    agents = (scope / 'AGENTS.md').read_text()
    local = re.search(r'<!-- project-memory-local:start -->(.*?)<!-- project-memory-local:end -->', agents, re.S)
    if local:
        for name, dirname in BUILTINS.items():
            flat = memory / (name.upper() + '.md')
            directory = memory / dirname
            if name in groups:
                continue
            if f'](.memory/{dirname}/AGENTS.md)' in local[1] or f'](.memory/{name.upper()}.md)' in local[1]:
                index = flat if f'](.memory/{name.upper()}.md)' in local[1] else directory / 'AGENTS.md'
                groups[name] = LegacyType(name, directory, [index], 'skills' if name in RENAMES else 'memory', name == 'user', name != 'agent_skills', 'skills' if name in RENAMES else 'ordinary', {}, True)
    for path in memory.iterdir():
        if path.is_dir() and not any(t.directory == path for t in groups.values()):
            # A public Git upgrade can leave only the ignored user's body directory.
            if path.name == 'users' and (scope / '.harness/memory/users/AGENTS.md').is_file():
                groups['user'] = LegacyType('user', path, [], 'memory', True, True, 'ordinary', {})
            else:
                raise ValueError('missing-type-index: ' + str(path))
    return list(groups.values())


def convert_index(text, spec):
    """Patch known metadata fields, preserving unknown fields and all prose bytes."""
    values = {'name': spec.new_name, 'module': spec.module, 'writable': str(spec.writable).lower(), 'gitignore': str(spec.private).lower(), 'format': spec.format}
    match = re.search(re.escape(START) + r'\n.*?' + re.escape(END), text, re.S)
    if match:
        block = match[0]
        for key, value in values.items():
            pattern = re.compile(r'^' + re.escape(key) + r':.*$', re.M)
            block = pattern.sub(key + ': ' + value, block) if pattern.search(block) else block.replace(END, key + ': ' + value + '\n' + END)
        return text[:match.start()] + block + text[match.end():]
    return START + '\n' + ''.join(f'{k}: {v}\n' for k, v in values.items()) + END + '\n\n' + text
