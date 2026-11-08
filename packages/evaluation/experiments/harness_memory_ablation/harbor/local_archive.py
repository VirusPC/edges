"""Preview or copy an immutable experiment tree into this experiment's ignored local area.

No source is deleted. Existing unequal files, symlinks and credential filenames
are conflicts. Private paths and per-file hashes stay in the ignored receipt.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil

HERE = Path(__file__).resolve().parent
FORBIDDEN = {'auth.json', '.env', '.env.local', '.env.current', 'credentials',
             'credentials.json', 'id_rsa', 'id_ed25519', '.git'}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def inventory(source: Path) -> list[dict]:
    if source.is_symlink() or not source.is_dir():
        raise ValueError('Source must be a real directory')
    rows = []
    for path in sorted(source.rglob('*')):
        relative = path.relative_to(source)
        if path.is_symlink() or any(part in FORBIDDEN for part in relative.parts):
            raise ValueError('Source contains a symlink or reserved credential/Git entry')
        if path.is_file():
            rows.append({'path': relative.as_posix(), 'bytes': path.stat().st_size,
                         'sha256': digest(path)})
        elif not path.is_dir():
            raise ValueError('Source contains a non-regular entry')
    if not rows:
        raise ValueError('Source is empty')
    return rows


def archive(source: Path, name: str, apply: bool = False, base: Path = HERE) -> dict:
    relative = PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or str(relative) != name or name in ('', '.'):
        raise ValueError('Name must be a normalized relative directory')
    if source.is_symlink():
        raise ValueError('Source must not be a symlink')
    source = source.resolve(strict=True)
    base = base.resolve(strict=True)
    local = base / 'local'
    target = local / name
    for ancestor in [local, target, *target.parents]:
        if ancestor.is_symlink():
            raise ValueError('Destination ancestry contains a symlink')
    resolved_target = target.resolve()
    if resolved_target.is_relative_to(source) or source.is_relative_to(resolved_target):
        raise ValueError('Source and destination must not contain one another')
    rows = inventory(source)
    conflicts, copies = [], []
    for row in rows:
        destination = target / row['path']
        if any(parent.is_symlink() for parent in destination.parents) or destination.is_symlink():
            conflicts.append(row['path'])
        elif destination.exists():
            if not destination.is_file() or digest(destination) != row['sha256']:
                conflicts.append(row['path'])
        else:
            copies.append(row)
    summary = {'files': len(rows), 'bytes': sum(row['bytes'] for row in rows),
               'new_files': len(copies), 'conflicts': len(conflicts), 'applied': False}
    if conflicts:
        raise ValueError(f'{len(conflicts)} destination conflicts; no files copied')
    if apply:
        target.mkdir(parents=True, exist_ok=True, mode=0o700)
        local.chmod(0o700)
        for row in copies:
            destination = target / row['path']
            destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            # Recheck the source at copy time; do not overwrite existing files.
            with (source / row['path']).open('rb') as src, destination.open('xb') as dst:
                try:
                    shutil.copyfileobj(src, dst)
                except BaseException:
                    destination.unlink()
                    raise
            destination.chmod(0o600)
            if digest(destination) != row['sha256']:
                destination.unlink()
                raise ValueError('Source changed during import; rerun the preview')
        receipts = local / 'receipts'
        receipts.mkdir(mode=0o700, exist_ok=True)
        receipt = receipts / (name.replace('/', '--') + '.json')
        payload = {'schema_version': 1, 'source': str(source), 'destination': name,
                   'files': rows, 'source_deleted': False}
        temporary = receipt.with_suffix('.tmp')
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, 'w') as stream:
            json.dump(payload, stream, ensure_ascii=False, indent=2)
            stream.write('\n')
        temporary.replace(receipt)
        summary['applied'] = True
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--name', default='archive')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    print(json.dumps(archive(args.source, args.name, args.apply), ensure_ascii=False))


if __name__ == '__main__':
    main()
