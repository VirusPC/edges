"""Real filesystem migration contracts; no repository fixtures are mutated."""
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
CLI = SCRIPTS / 'migrate.py'
ENTRY = '<!-- project-memory-entries:start -->\n- 暂无条目。\n<!-- project-memory-entries:end -->\n'

def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)

def legacy(root, kinds=('project', 'user', 'skills')):
    dirs = {'project': 'projects', 'user': 'users', 'skills': 'skills', 'agent_skills': 'agent_skills', 'feedback': 'feedbacks'}
    links = []
    for kind in kinds:
        rel = '.memory/' + dirs.get(kind, kind) + '/AGENTS.md'
        write(root / rel, '# ' + kind + '\nmanual intro\n' + ENTRY)
        links.append(f'- [{kind}]({rel}) — test')
    write(root / 'AGENTS.md', '# Manual\nhistory `.memory/skills` unchanged\n<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n' + '\n'.join(links) + '\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n<!-- project-memory-children:end -->\n<!-- project-memory:end -->\n')

def snapshot(root):
    result = {}
    for base, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = [d for d in dirs if d not in {'.git', '.project-memory-migration'}]
        for name in files + [d for d in dirs if (Path(base) / d).is_symlink()]:
            path = Path(base) / name
            result[str(path.relative_to(root))] = (os.readlink(path) if path.is_symlink() else path.read_bytes(), stat.S_IMODE(path.lstat().st_mode))
    return result

class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'repo'
        self.root.mkdir()
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)

    def run_cli(self, *args, good=True):
        run = subprocess.run([sys.executable, str(CLI), '--target-dir', str(self.root), *args], text=True, capture_output=True)
        if good:
            self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        else:
            self.assertNotEqual(run.returncode, 0)
        return json.loads(run.stdout) if run.stdout else {}

    def test_link_labels_with_code_are_links_but_code_examples_are_not(self):
        from migrate import rewrite_links
        source=self.root/'old/doc.md'; target=self.root/'new/deep/doc.md'
        def mapped(path):
            return self.root/'new/asset.png' if path==self.root/'old/asset.png' else path
        text='[`asset`](asset.png)\n![image](asset.png)\n[ordinary](asset.png)\n`[example](asset.png)`\n```md\n[example](asset.png)\n```\n'
        result=rewrite_links(text,source,target,mapped)
        self.assertIn('[`asset`](../asset.png)',result)
        self.assertIn('![image](../asset.png)',result)
        self.assertIn('[ordinary](../asset.png)',result)
        self.assertIn('`[example](asset.png)`',result)
        self.assertIn('```md\n[example](asset.png)\n```',result)
        example = r'`f"- [\`{x}\`]({x}) — {d}"`'
        self.assertEqual(rewrite_links(example, source, target, mapped), example)

    def test_moves_private_bytes_assets_modes_and_is_idempotent(self):
        legacy(self.root)
        secret = self.root / '.memory/users/user_private.md'
        secret.write_bytes(b'---\r\nunknown: yes\r\n---\r\nsecret\x00\n')
        asset = self.root / '.memory/skills/method/assets/data.bin'
        asset.parent.mkdir(parents=True)
        asset.write_bytes(bytes(range(256)))
        asset.chmod(0o751)
        write(self.root / '.memory/skills/method/SKILL.md', '---\nname: method\ndescription: method\nmetadata:\n  edges-type: skills\n  unknown: keep\n---\nbody\n')
        self.run_cli('--recursive')
        self.assertEqual((self.root / '.harness/memory/users/user_private.md').read_bytes(), b'---\r\nunknown: yes\r\n---\r\nsecret\x00\n')
        moved = self.root / '.harness/skills/managed/method/assets/data.bin'
        self.assertEqual(moved.read_bytes(), bytes(range(256)))
        self.assertEqual(stat.S_IMODE(moved.stat().st_mode), 0o751)
        self.assertIn('edges-type: managed', (moved.parents[1] / 'SKILL.md').read_text())
        self.assertFalse((self.root / '.memory').exists())
        self.assertIn('history `.memory/skills` unchanged', (self.root / 'AGENTS.md').read_text())
        self.assertEqual(subprocess.run(['git', '-C', str(self.root), 'check-ignore', '-q', '.harness/memory/users/AGENTS.md']).returncode, 0)
        self.assertEqual(stat.S_IMODE((self.root / '.project-memory-migration').stat().st_mode), 0o700)
        before = snapshot(self.root)
        self.run_cli('--recursive')
        self.assertEqual(snapshot(self.root), before)

    def test_conflicts_preflight_every_scope_without_mutation(self):
        legacy(self.root)
        child = self.root / 'deep/child'
        legacy(child, ('project',))
        write(child / '.harness/runa.txt', 'historical unrelated')
        before = snapshot(self.root)
        self.run_cli('--recursive', good=False)
        self.assertEqual(snapshot(self.root), before)

    def test_dry_run_has_no_mutations(self):
        legacy(self.root)
        before = snapshot(self.root)
        result = self.run_cli('--dry-run')
        self.assertTrue(result['pathMap'])
        self.assertEqual(snapshot(self.root), before)

    def test_nested_owner_moves_once_and_rebases_owned_links(self):
        legacy(self.root, ('skills',))
        method = self.root / '.memory/skills/method'
        legacy(method, ('project',))
        write(method / 'SKILL.md', '---\nname: method\ndescription: x\n---\n')
        write(method / '.memory/projects/project_x.md', 'unchanged')
        outside = self.root / 'outside.txt'
        outside.write_text('external')
        (method / 'external').symlink_to('../../../outside.txt')
        (self.root / '.agents/skills').mkdir(parents=True)
        (self.root / '.agents/skills/alias').symlink_to('../../.memory/skills/method')
        self.run_cli('--recursive')
        dest = self.root / '.harness/skills/managed/method'
        self.assertEqual((dest / '.harness/memory/projects/project_x.md').read_text(), 'unchanged')
        self.assertFalse((dest / '.memory').exists())
        self.assertEqual((dest / 'external').resolve(), outside)
        self.assertEqual((self.root / '.agents/skills/alias').resolve(), dest)
        self.assertFalse((self.root / '.memory').exists())

    def test_git_upgraded_public_layout_only_merges_nonconflicting_private(self):
        sys.path.insert(0, str(SCRIPTS.parents[1] / 'project-memory-init/scripts'))
        from operations.init import init_memory
        init_memory(self.root, self.root, 'scope', memory_types=['project', 'user'], skill_types=[])
        public = self.root / '.harness/memory/projects/project_keep.md'
        public.write_text('public newer edit')
        agents = (self.root / 'AGENTS.md').read_bytes()
        users = self.root / '.memory/users'
        write(users / 'AGENTS.md', '# user\n' + ENTRY)
        write(users / 'user_local.md', 'local private')
        # Existing generated private index is an actual conflict; do not guess a merge.
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)
        (self.root / '.harness/memory/users/AGENTS.md').unlink()
        self.run_cli()
        self.assertEqual(public.read_text(), 'public newer edit')
        self.assertEqual((self.root / 'AGENTS.md').read_bytes(), agents)
        self.assertEqual((self.root / '.harness/memory/users/user_local.md').read_text(), 'local private')

    def test_custom_metadata_and_flat_legacy_fixture_conversion(self):
        legacy(self.root, ('docs', 'feedback', 'user', 'agent_skills'))
        meta = '<!-- project-memory-type:start -->\nname: docs\ndescription: docs\nwritable: false\ngitignore: true\nformat: skills\nunknown: keep\n<!-- project-memory-type:end -->\n'
        write(self.root / '.memory/docs/AGENTS.md', meta + '# manual\n' + ENTRY)
        for source, flat in [('docs', 'DOCS'), ('feedbacks', 'FEEDBACK'), ('users', 'USER'), ('agent_skills', 'AGENT_SKILLS')]:
            path = self.root / '.memory' / source / 'AGENTS.md'
            path.rename(self.root / '.memory' / (flat + '.md'))
        result = self.run_cli()
        self.assertIn('incomplete', result['status'])
        self.assertFalse((self.root / '.agents').exists())
        self.assertTrue((self.root / '.harness/memory/docs/AGENTS.md').is_file())
        text = (self.root / '.harness/memory/docs/AGENTS.md').read_text()
        for value in ['writable: false', 'gitignore: true', 'unknown: keep', 'module: memory']:
            self.assertIn(value, text)
        self.assertTrue((self.root / '.harness/skills/referenced/AGENTS.md').exists())

    def test_custom_module_is_independent_of_format_and_preserves_original_directory(self):
        for module, fmt, expected in [(None, 'skills', 'memory'), ('memory', 'skills', 'memory'), ('skills', 'ordinary', 'skills')]:
            with self.subTest(module=module, format=fmt), tempfile.TemporaryDirectory() as raw:
                root = Path(raw).resolve()
                legacy(root, ('docs',))
                fields = 'name: guide\nwritable: false\nindex-only: true\ngitignore: true\nformat: ' + fmt + '\nunknown: keep\n'
                if module:
                    fields += 'module: ' + module + '\n'
                write(root / '.memory/docs/AGENTS.md', '<!-- project-memory-type:start -->\n' + fields + '<!-- project-memory-type:end -->\nmanual intro\n' + ENTRY)
                rel = 'method/SKILL.md' if fmt == 'skills' else 'guide_example.md'
                body = b'---\nname: method\ndescription: example\n---\nbody  \n'
                source = root / '.memory/docs' / rel
                source.parent.mkdir(parents=True, exist_ok=True)
                source.write_bytes(body)
                write(root / '.memory/docs/assets/data', 'asset bytes')
                import migrate
                result = migrate.migrate(root)
                self.assertEqual(result['status'], 'migrated')
                dest = root / '.harness' / expected / 'docs'
                self.assertTrue((dest / rel).is_file(), 'custom body must retain its module and directory')
                self.assertEqual((dest / rel).read_bytes(), body)
                self.assertEqual((dest / 'assets/data').read_text(), 'asset bytes')
                index = (dest / 'AGENTS.md').read_text()
                for value in ['name: guide', 'writable: false', 'index-only: true', 'gitignore: true', 'unknown: keep', 'manual intro', f']({rel})']:
                    self.assertIn(value, index)
                self.assertIn(f'](.harness/{expected}/docs/AGENTS.md)', (root / 'AGENTS.md').read_text())
                self.assertIn(f'/.harness/{expected}/docs/', (root / '.gitignore').read_text())
                specs = migrate.layer_type_specs(root)
                self.assertEqual([(x.name, x.module, x.format, x.writable, x.gitignore) for x in specs], [('guide', expected, fmt, False, True)])
                before = snapshot(root)
                self.assertEqual(migrate.migrate(root)['pathMap'], [])
                self.assertEqual(snapshot(root), before)

    def test_unsupported_custom_module_fails_before_mutation(self):
        legacy(self.root, ('docs',))
        write(self.root / '.memory/docs/AGENTS.md', '<!-- project-memory-type:start -->\nname: docs\nmodule: tasks\nwritable: false\ngitignore: true\nformat: skills\n<!-- project-memory-type:end -->\n' + ENTRY)
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)
        self.assertFalse((self.root / '.project-memory-migration').exists())

    def test_custom_identity_cannot_take_official_destination(self):
        for dirname, module in [('users', 'memory'), ('managed', 'skills')]:
            with self.subTest(directory=dirname), tempfile.TemporaryDirectory() as raw:
                root = Path(raw).resolve()
                legacy(root, (dirname,))
                write(root / '.memory' / dirname / 'AGENTS.md', '<!-- project-memory-type:start -->\nname: docs\nmodule: ' + module + '\nwritable: false\ngitignore: true\nformat: skills\n<!-- project-memory-type:end -->\n' + ENTRY)
                before = snapshot(root)
                import migrate
                with self.assertRaisesRegex(ValueError, 'Official type path conflict'):
                    migrate.migrate(root)
                self.assertEqual(snapshot(root), before)

    def test_private_existing_directories_protected_before_copy(self):
        import migrate
        for parent_mode, user_mode, existing_mode, expected in [(0o755, 0o700, 0o755, 0o700), (0o700, 0o755, 0o755, 0o700), (0o755, 0o750, 0o700, 0o700)]:
            with self.subTest(parent=parent_mode, users=user_mode, existing=existing_mode), tempfile.TemporaryDirectory() as raw:
                root = Path(raw).resolve()
                legacy(root, ('user',))
                users = root / '.memory/users'
                write(users / 'user_secret.md', 'private bytes')
                (users / 'user_secret.md').chmod(0o644)
                write(users / 'assets/nested/data', 'private asset')
                (users / 'assets').chmod(0o700)
                users.chmod(user_mode)
                (root / '.memory').chmod(parent_mode)
                dest = root / '.harness/memory/users'
                (dest / 'assets/nested').mkdir(parents=True)
                dest.chmod(existing_mode)
                (dest / 'assets').chmod(0o755)
                agents = root / 'AGENTS.md'
                agents.write_text(agents.read_text().replace('.memory/users/AGENTS.md', '.harness/memory/users/AGENTS.md'))
                public = root / 'public'
                public.mkdir(mode=0o755)
                original_write = migrate.write_state
                copied = []
                def probe(path, value):
                    if path.is_relative_to(dest):
                        self.assertEqual(stat.S_IMODE(dest.stat().st_mode), expected)
                        self.assertEqual(stat.S_IMODE((dest / 'assets').stat().st_mode), 0o700)
                        copied.append(path)
                    original_write(path, value)
                with patch.object(migrate, 'write_state', side_effect=probe):
                    migrate.migrate(root)
                self.assertTrue(copied)
                self.assertEqual((dest / 'user_secret.md').read_text(), 'private bytes')
                self.assertEqual((dest / 'assets/nested/data').read_text(), 'private asset')
                self.assertEqual(stat.S_IMODE((dest / 'user_secret.md').stat().st_mode), 0o644)
                self.assertEqual(stat.S_IMODE(public.stat().st_mode), 0o755)
                self.assertFalse((root / '.memory').exists())

    def test_recovery_rejects_changed_source_or_target_directory_modes(self):
        import migrate
        for rel, changed in [('.harness/memory/users', 0o755), ('.harness/memory/users/assets', 0o750), ('.memory/users', 0o750), ('.memory', 0o700)]:
            with self.subTest(path=rel), tempfile.TemporaryDirectory() as raw:
                root = Path(raw).resolve()
                legacy(root, ('user',))
                write(root / '.memory/users/assets/data', 'private asset')
                (root / '.memory').chmod(0o755)
                (root / '.memory/users').chmod(0o700)
                with patch.object(migrate, 'validate', side_effect=OSError('interrupt after copy')):
                    with self.assertRaises(OSError):
                        migrate.migrate(root)
                directory = root / rel
                original_mode = stat.S_IMODE(directory.stat().st_mode)
                directory.chmod(changed)
                before = snapshot(root)
                with self.assertRaisesRegex(ValueError, 'directory-mode-changed'):
                    migrate.migrate(root)
                self.assertEqual(snapshot(root), before)
                self.assertEqual(stat.S_IMODE(directory.stat().st_mode), changed)
                directory.chmod(original_mode)
                migrate.migrate(root)
                self.assertFalse((root / '.memory').exists())

    def test_old_pending_journal_without_directory_permissions_is_not_replayed(self):
        import migrate
        legacy(self.root, ('user',))
        users = self.root / '.memory/users'
        users.joinpath('AGENTS.md').rename(self.root / '.memory/USER.md')
        users.rmdir()
        self.root = self.root.resolve()
        job = migrate.plan(self.root, False)
        job.pop('sourceDirectoryModes')
        job['directoryMap'] = []  # Old flat-index jobs did not plan a type directory.
        job.update(target=str(self.root), recursive=False, phase='planned')
        journal = self.root / migrate.JOURNAL / 'journal.json'
        write(journal, json.dumps(job))
        before = snapshot(self.root)
        with self.assertRaisesRegex(ValueError, 'journal-directory-permissions-missing'):
            migrate.migrate(self.root)
        self.assertEqual(snapshot(self.root), before)
        self.assertEqual(json.loads(journal.read_text()), job)
        self.assertFalse((self.root / '.harness').exists())

    def test_missing_or_invalid_privileges_and_builtin_collision_conflict(self):
        for fields in ['name: docs\n', 'name: docs\nwritable: maybe\ngitignore: true\n', 'name: managed\nwritable: true\ngitignore: false\n']:
            with self.subTest(fields=fields):
                legacy(self.root, ('docs',))
                write(self.root / '.memory/docs/AGENTS.md', '<!-- project-memory-type:start -->\n' + fields + '<!-- project-memory-type:end -->\n' + ENTRY)
                before = snapshot(self.root)
                self.run_cli(good=False)
                self.assertEqual(snapshot(self.root), before)

    def test_identical_flat_leftover_coalesces_different_conflicts(self):
        legacy(self.root, ('feedback',))
        flat = self.root / '.memory/FEEDBACK.md'
        flat.write_text('different\n' + ENTRY)
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)
        flat.write_bytes((self.root / '.memory/feedbacks/AGENTS.md').read_bytes())
        self.run_cli()
        self.assertFalse(flat.exists())

    def test_nested_repository_and_external_install_directory_excluded(self):
        legacy(self.root, ('project',))
        nested = self.root / 'submodule'
        legacy(nested, ('user',))
        (nested / '.git').write_text('gitdir: elsewhere')
        external = Path(self.tmp.name) / 'external'
        legacy(external, ('user',))
        (self.root / '.agents').mkdir()
        (self.root / '.agents/skills').symlink_to(external)
        before = snapshot(external), snapshot(nested)
        self.run_cli('--recursive')
        self.assertEqual((snapshot(external), snapshot(nested)), before)

    def test_rebuilds_owned_and_referenced_inventory_and_preserves_manual_text(self):
        legacy(self.root, ('skills', 'agent_skills'))
        method = self.root / '.memory/skills/method'
        write(method / 'SKILL.md', '---\nname: method\ndescription: live description\nmetadata:\n  strange: untouched\n---\n[manual](../../../README.md)\n')
        write(self.root / 'README.md', 'manual')
        (self.root / '.agents/skills').mkdir(parents=True)
        (self.root / '.agents/skills/alias').symlink_to('../../.memory/skills/method')
        self.run_cli()
        managed = (self.root / '.harness/skills/managed/AGENTS.md').read_text()
        referenced = (self.root / '.harness/skills/referenced/AGENTS.md').read_text()
        self.assertIn('[method](method/SKILL.md) — live description', managed)
        self.assertIn('manual intro', managed)
        self.assertIn('alias/SKILL.md', referenced)
        self.assertIn('live description', referenced)

    def test_incomplete_source_status_persists_until_source_available(self):
        legacy(self.root, ('agent_skills',))
        index = self.root / '.memory/agent_skills/AGENTS.md'
        index.write_text(index.read_text().replace('- 暂无条目。', '- [old](../../.agents/skills/old/SKILL.md) — preserved'))
        for run in range(2):
            result = self.run_cli()
            self.assertFalse(result['complete'])
            self.assertTrue(result['diagnostics'])
            self.assertFalse((self.root / '.agents').exists())
        self.assertIn('preserved', (self.root / '.harness/skills/referenced/AGENTS.md').read_text())

    def test_empty_asset_directory_and_modes_survive(self):
        legacy(self.root, ('skills',))
        empty = self.root / '.memory/skills/method/assets/empty'
        empty.mkdir(parents=True)
        empty.chmod(0o750)
        self.run_cli()
        moved = self.root / '.harness/skills/managed/method/assets/empty'
        self.assertTrue(moved.is_dir())
        self.assertEqual(stat.S_IMODE(moved.stat().st_mode), 0o750)

    def test_source_added_after_copy_stops_before_deletion(self):
        import migrate
        legacy(self.root, ('user',))
        original = migrate.validate
        def inject(target, job):
            write(target / '.memory/users/user_new.md', 'added during operation')
            original(target, job)
        with patch.object(migrate, 'validate', side_effect=inject):
            with self.assertRaises(ValueError):
                migrate.migrate(self.root)
        self.assertTrue((self.root / '.memory/users/AGENTS.md').is_file())

    def test_unregistered_type_is_adopted_and_sparse_child_link_survives(self):
        legacy(self.root, ('project',))
        child = self.root / 'projects/deep/component'
        legacy(child, ('feedback',))
        agents = self.root / 'AGENTS.md'
        agents.write_text(agents.read_text().replace('<!-- project-memory-children:end -->', '- [child](projects/deep/component/AGENTS.md) — child scope\n<!-- project-memory-children:end -->'))
        write(self.root / '.memory/references/AGENTS.md', '# References\n' + ENTRY)
        self.run_cli('--recursive')
        text = agents.read_text()
        self.assertIn('](.harness/memory/references/AGENTS.md)', text)
        self.assertIn('](projects/deep/component/AGENTS.md)', text)
        self.assertTrue((child / '.harness/memory/feedbacks/AGENTS.md').is_file())

    def test_unreadable_referenced_source_preserves_index_with_diagnostic(self):
        import migrate
        legacy(self.root, ('agent_skills',))
        (self.root / '.agents/skills').mkdir(parents=True)
        original = os.scandir
        def denied(path):
            if Path(path) == self.root / '.agents/skills':
                raise PermissionError('unavailable')
            return original(path)
        with patch.object(migrate.os, 'scandir', side_effect=denied):
            result = migrate.migrate(self.root)
        self.assertFalse(result['complete'])
        self.assertIn('manual intro', (self.root / '.harness/skills/referenced/AGENTS.md').read_text())

    def test_owned_asset_links_never_follow_external_data_or_linked_type(self):
        legacy(self.root, ('skills',))
        external = Path(self.tmp.name) / 'outside'
        external.mkdir()
        (external / 'private').write_text('outside bytes')
        method = self.root / '.memory/skills/method'
        method.mkdir()
        (method / 'assets').symlink_to(external)
        before = snapshot(external)
        self.run_cli()
        self.assertEqual((self.root / '.harness/skills/managed/method/assets').resolve(), external)
        self.assertEqual(snapshot(external), before)

    def test_symlink_target_parent_conflicts_before_private_ignore_write(self):
        legacy(self.root, ('user',))
        external = Path(self.tmp.name) / 'outside'
        external.mkdir()
        (self.root / '.harness').symlink_to(external)
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)
        self.assertEqual(list(external.iterdir()), [])

    def test_ignore_is_effective_before_first_private_copy(self):
        import migrate
        legacy(self.root, ('user',))
        original = migrate.write_state
        observed = []
        def check(path, value):
            if '.harness/memory/users' in str(path) or '.project-memory-migration' in str(path):
                result = subprocess.run(['git', '-C', str(self.root), 'check-ignore', '-q', str(path)])
                self.assertEqual(result.returncode, 0)
                observed.append(path)
            return original(path, value)
        with patch.object(migrate, 'write_state', side_effect=check):
            migrate.migrate(self.root)
        self.assertTrue(observed)

    def test_absent_adopted_official_private_index_preserves_adoption(self):
        legacy(self.root, ('project', 'user'))
        (self.root / '.memory/users/AGENTS.md').unlink()
        (self.root / '.memory/users').rmdir()
        result = self.run_cli()
        index = self.root / '.harness/memory/users/AGENTS.md'
        self.assertTrue(index.is_file())
        self.assertIn('gitignore: true', index.read_text())
        self.assertEqual(list(index.parent.iterdir()), [index])
        self.assertIn('](.harness/memory/users/AGENTS.md)', (self.root / 'AGENTS.md').read_text())
        self.assertIn('legacy-index-missing', {d['code'] for d in result['diagnostics']})
        self.assertEqual(subprocess.run(['git', '-C', str(self.root), 'check-ignore', '-q', str(index)]).returncode, 0)
        again = self.run_cli()
        self.assertIn('legacy-index-missing', {d['code'] for d in again['diagnostics']})

    def test_absent_private_index_rebuilds_only_actual_records(self):
        legacy(self.root, ('user',))
        (self.root / '.memory/users/AGENTS.md').unlink()
        write(self.root / '.memory/users/user_real.md', '---\nname: real\ndescription: local\n---\nbody')
        self.run_cli()
        text = (self.root / '.harness/memory/users/AGENTS.md').read_text()
        self.assertIn('[real](user_real.md) — local', text)

    def test_restored_custom_ordinary_metadata_unknown_fields_preserved(self):
        legacy(self.root, ('docs',))
        index = self.root / '.memory/docs/AGENTS.md'
        index.write_text('<!-- project-memory-type:start -->\nname: docs\nwritable: true\ngitignore: false\nformat: ordinary\nfuture-key: a:b\n<!-- project-memory-type:end -->\n' + index.read_text())
        body = b'---\nname: docs_x\ndescription: custom\nmetadata:\n  unknown: [keep, exact]\n---\nbody  \n'
        (index.parent / 'docs_x.md').write_bytes(body)
        self.run_cli()
        self.assertEqual((self.root / '.harness/memory/docs/docs_x.md').read_bytes(), body)
        self.assertIn('future-key: a:b', (self.root / '.harness/memory/docs/AGENTS.md').read_text())

    def test_nested_moving_scope_requires_recursive_preflight(self):
        legacy(self.root, ('skills',))
        legacy(self.root / '.memory/skills/method', ('project',))
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)

    def test_referenced_body_inside_moving_owner_is_never_rewritten(self):
        legacy(self.root, ('skills',))
        method = self.root / '.memory/skills/method'
        legacy(method, ('agent_skills',))
        body = '---\nname: original\ndescription: keep\nmetadata:\n  edges-type: skills\n---\n[history](../old.md)\n'
        write(method / '.agents/skills/original/SKILL.md', body)
        self.run_cli('--recursive')
        self.assertEqual((self.root / '.harness/skills/managed/method/.agents/skills/original/SKILL.md').read_text(), body)

    def test_mismatched_official_type_identity_conflicts_before_write(self):
        legacy(self.root, ('project',))
        path = self.root / '.memory/projects/AGENTS.md'
        path.write_text('<!-- project-memory-type:start -->\nname: user\ngitignore: true\nwritable: true\n<!-- project-memory-type:end -->\n' + ENTRY)
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)

    def test_external_source_change_after_copy_stops_retirement(self):
        import migrate
        legacy(self.root, ('agent_skills',))
        skill = self.root / '.agents/skills/original/SKILL.md'
        write(skill, '---\nname: original\ndescription: before\n---\n')
        original = migrate.validate
        def changed(target, job):
            skill.write_text('---\nname: original\ndescription: later\n---\n')
            original(target, job)
        with patch.object(migrate, 'validate', side_effect=changed):
            with self.assertRaises(ValueError):
                migrate.migrate(self.root)
        self.assertTrue((self.root / '.memory/agent_skills/AGENTS.md').is_file())

    def test_managed_skill_body_cannot_escape_storage_owner(self):
        legacy(self.root, ('skills',))
        external = Path(self.tmp.name) / 'outside-method'
        write(external / 'SKILL.md', '---\nname: external\ndescription: external\n---\n')
        (self.root / '.memory/skills/alias').symlink_to(external)
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)

    def test_existing_source_changed_after_copy_prevents_all_retirement(self):
        import migrate
        legacy(self.root, ('user',))
        body = self.root / '.memory/users/user_z.md'
        write(body, 'before')
        original = migrate.validate
        def changed(target, job):
            body.write_text('later source edit')
            original(target, job)
        with patch.object(migrate, 'validate', side_effect=changed):
            with self.assertRaises(ValueError):
                migrate.migrate(self.root)
        self.assertTrue((self.root / '.memory/users/AGENTS.md').is_file())
        self.assertEqual(body.read_text(), 'later source edit')

    def test_owned_dependency_named_assets_are_copied_before_retirement(self):
        legacy(self.root, ('skills',))
        method = self.root / '.memory/skills/method'
        write(method / 'SKILL.md', '---\nname: method\ndescription: owned assets\n---\n')
        for name in ('node_modules', '.project-memory-migration'):
            asset = method / name / 'data'
            write(asset, 'owned ' + name)
            asset.chmod(0o640)
        self.run_cli()
        moved = self.root / '.harness/skills/managed/method'
        for name in ('node_modules', '.project-memory-migration'):
            self.assertEqual((moved / name / 'data').read_text(), 'owned ' + name)
            self.assertEqual(stat.S_IMODE((moved / name / 'data').stat().st_mode), 0o640)
        self.assertFalse((self.root / '.memory').exists())

    def test_owned_nested_repository_is_rejected_without_mutation(self):
        legacy(self.root, ('skills',))
        method = self.root / '.memory/skills/method'
        write(method / 'SKILL.md', '---\nname: method\ndescription: test\n---\n')
        write(method / 'node_modules/nested/.git', 'gitdir: outside')
        write(method / 'node_modules/nested/data', 'preserve')
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)
        self.assertFalse((self.root / '.project-memory-migration').exists())

    def test_all_official_type_module_mismatches_fail_preflight(self):
        for kind, directory in [('user', 'users'), ('project', 'projects'), ('feedback', 'feedbacks'), ('reference', 'references')]:
            with self.subTest(kind=kind):
                with tempfile.TemporaryDirectory() as raw:
                    scope = Path(raw)
                    legacy(scope, (kind,))
                    # reference's fixture default spelling differs; make its official path explicit.
                    original = scope / '.memory' / ('reference' if kind == 'reference' else directory) / 'AGENTS.md'
                    if kind == 'reference':
                        original.parent.rename(scope / '.memory/references')
                        agents = scope / 'AGENTS.md'
                        agents.write_text(agents.read_text().replace('.memory/reference/', '.memory/references/'))
                    index = scope / '.memory' / directory / 'AGENTS.md'
                    index.write_text('<!-- project-memory-type:start -->\nname: ' + kind + '\nformat: skills\ngitignore: ' + ('true' if kind == 'user' else 'false') + '\nwritable: true\n<!-- project-memory-type:end -->\n' + ENTRY)
                    before = snapshot(scope)
                    run = subprocess.run([sys.executable, str(CLI), '--target-dir', str(scope)], capture_output=True, text=True)
                    self.assertNotEqual(run.returncode, 0)
                    self.assertEqual(snapshot(scope), before)
                    self.assertFalse((scope / '.project-memory-migration').exists())
                    self.assertFalse((scope / '.harness').exists())

    def test_resume_failure_and_later_edits_are_not_overwritten(self):
        self.assertTrue(CLI.is_file(), 'migration CLI missing')
        import migrate
        legacy(self.root, ('user',))
        write(self.root / '.memory/users/user_x.md', 'secret')
        with patch.object(migrate, 'validate', side_effect=OSError('injected after-copy failure')):
            with self.assertRaises(OSError):
                migrate.migrate(self.root)
        self.assertTrue((self.root / '.memory/users/user_x.md').exists())
        dest = self.root / '.harness/memory/users/user_x.md'
        dest.write_text('later edit')
        before = snapshot(self.root)
        self.run_cli(good=False)
        self.assertEqual(snapshot(self.root), before)
        dest.write_text('secret')
        self.run_cli()
        self.assertFalse((self.root / '.memory').exists())
        dest.write_text('even later')
        self.run_cli()
        self.assertEqual(dest.read_text(), 'even later')

if __name__ == '__main__':
    unittest.main()
