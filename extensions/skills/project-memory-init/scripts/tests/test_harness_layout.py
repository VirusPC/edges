"""Real-filesystem acceptance tests for selected types and scope ownership."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

MEMORY = Path(__file__).resolve().parents[1] / 'memory.py'

class HarnessLayoutTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def run_cli(self, *args, ok=True, target=None):
        result = subprocess.run([sys.executable, str(MEMORY), args[0], '--target-dir', str(target or self.root), *args[1:]], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0 if ok else 1, result.stdout + result.stderr)
        return json.loads(result.stdout)

    def init(self, *args, target=None):
        return self.run_cli('init', '--root-dir', str(self.root), *args, target=target)

    def write_skill(self, path, name='same'):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(f'---\nname: {name}\ndescription: example\n---\nBody\n')

    def test_new_scope_requires_selection_without_mutation(self):
        result = self.init()
        self.assertTrue(result['selectionRequired'])
        self.assertEqual(list(self.root.iterdir()), [])

    def test_selected_types_and_refresh_do_not_expand_adoption(self):
        self.init('--memory-types', 'project', '--skill-types', 'managed')
        self.assertTrue((self.root / '.harness/memory/projects/AGENTS.md').is_file())
        self.assertTrue((self.root / '.harness/skills/managed/AGENTS.md').is_file())
        self.init()
        self.assertFalse((self.root / '.harness/memory/users').exists())
        self.assertFalse((self.root / '.memory').exists())
        self.assertFalse((self.root / '.harness/skills/AGENTS.md').exists())

    def test_skills_only_remember_and_referenced_rejects_writes(self):
        self.init('--skill-types', 'managed', 'referenced')
        self.run_cli('remember', '--type', 'managed', '--slug', 'my-method', '--description', 'Method', '--content', 'Body')
        self.assertTrue((self.root / '.harness/skills/managed/my-method/SKILL.md').is_file())
        self.assertFalse((self.root / '.harness/memory').exists())
        self.assertFalse((self.root / '.agents').exists())
        self.run_cli('remember', '--type', 'referenced', '--slug', 'x', '--description', 'x', '--content', 'x', ok=False)

    def test_custom_skill_formats_keep_their_selected_module(self):
        self.init('--memory-types', 'project')
        for module, name in [('memory', 'recipes'), ('skills', 'playbooks')]:
            self.run_cli('add-type', '--module', module, '--name', name, '--description', name, '--skills-format')
            self.run_cli('remember', '--type', name, '--slug', 'run-it', '--description', 'Run', '--content', 'body')
            self.assertTrue((self.root / f'.harness/{module}/{name}/run-it/SKILL.md').is_file())
        self.init()
        self.assertFalse((self.root / '.harness/skills/recipes').exists())

    def test_managed_linked_ancestor_cannot_expand_write_owner(self):
        self.init('--skill-types', 'managed')
        outside = self.root / 'outside'
        outside.mkdir()
        (self.root / '.harness/skills/managed/escape').symlink_to(outside, target_is_directory=True)
        self.run_cli('remember', '--type', 'managed', '--slug', 'escape', '--description', 'x', '--content', 'x', ok=False)
        self.assertEqual(list(outside.iterdir()), [])

    def test_linked_harness_cannot_write_outside_scope(self):
        with tempfile.TemporaryDirectory() as d:
            (self.root / '.harness').symlink_to(d, target_is_directory=True)
            self.run_cli('init', '--memory-types', 'project', ok=False)
            self.assertEqual(list(Path(d).iterdir()), [])

    def test_referenced_aliases_deduplicate_realpath_not_names(self):
        self.write_skill(self.root / '.agents/skills/one/SKILL.md')
        self.write_skill(self.root / '.agents/skills/two/SKILL.md')
        (self.root / '.agents/skills/alias').symlink_to('one', target_is_directory=True)
        self.write_skill(self.root / 'child/.agents/skills/hidden/SKILL.md')
        self.init('--skill-types', 'referenced')
        index = (self.root / '.harness/skills/referenced/AGENTS.md').read_text()
        self.assertEqual(index.count(' — example'), 2)
        self.assertNotIn('hidden', index)

    def test_same_source_is_retained_in_both_types(self):
        self.init('--skill-types', 'managed', 'referenced')
        self.run_cli('remember', '--type', 'managed', '--slug', 'local', '--description', 'example', '--content', 'body')
        installed = self.root / '.agents/skills'
        installed.mkdir(parents=True)
        (installed / 'local').symlink_to(self.root / '.harness/skills/managed/local', target_is_directory=True)
        self.init()
        for name in ('managed', 'referenced'):
            self.assertIn(' — example', (self.root / f'.harness/skills/{name}/AGENTS.md').read_text())

    def test_broken_source_does_not_erase_existing_index(self):
        self.write_skill(self.root / '.agents/skills/one/SKILL.md')
        self.init('--skill-types', 'referenced')
        index = self.root / '.harness/skills/referenced/AGENTS.md'
        original = index.read_bytes()
        (self.root / '.agents/skills/broken').symlink_to('missing', target_is_directory=True)
        result = self.init()
        self.assertFalse(result['complete'])
        self.assertEqual(index.read_bytes(), original)
        report = self.run_cli('doctor', '--root-dir', str(self.root), '--apply')
        self.assertTrue(any(f['code'] == 'source-scan-error' for f in report['findings']))
        self.assertEqual(index.read_bytes(), original)

    def test_sparse_children_skip_business_indexes_and_nested_git(self):
        self.init('--skill-types', 'managed')
        child = self.root / 'src/deep'
        child.mkdir(parents=True)
        self.init('--memory-types', 'project', target=child)
        business = self.root / 'tasks'
        business.mkdir()
        (business / 'AGENTS.md').write_text('# Business tasks\n')
        nested = self.root / 'vendor/repo'
        nested.mkdir(parents=True)
        (nested / '.git').mkdir()
        self.run_cli('init', '--root-dir', str(nested), '--memory-types', 'project', target=nested)
        self.run_cli('doctor', '--root-dir', str(self.root), '--apply')
        agents = (self.root / 'AGENTS.md').read_text()
        self.assertIn('src/deep/AGENTS.md', agents)
        self.assertNotIn('tasks/AGENTS.md', agents)
        self.assertNotIn('vendor/repo', agents)
        self.assertNotIn('.harness/skills/managed/AGENTS.md', agents.split('<!-- project-memory-children:start -->')[1])

    def test_legacy_is_migration_required_and_never_repaired(self):
        old = self.root / '.memory/projects'
        old.mkdir(parents=True)
        (old / 'project_old.md').write_text('old bytes')
        self.run_cli('init', '--memory-types', 'project', ok=False)
        result = self.run_cli('doctor', '--apply')
        self.assertTrue(any(f['code'] == 'migration-required' for f in result['findings']))
        self.assertFalse((self.root / '.harness').exists())
        self.assertEqual((old / 'project_old.md').read_text(), 'old bytes')

    def test_preserves_manual_agents_sections(self):
        self.init('--memory-types', 'project')
        agents = self.root / 'AGENTS.md'
        agents.write_text('Manual before\n\n' + agents.read_text() + '\nManual after\n')
        self.init('--skill-types', 'managed')
        self.run_cli('doctor', '--apply')
        self.assertTrue(agents.read_text().startswith('Manual before\n\n'))
        self.assertTrue(agents.read_text().endswith('\nManual after\n'))

    def test_private_index_and_body_are_ignored_on_creation(self):
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.init('--memory-types', 'user')
        self.run_cli('remember', '--type', 'user', '--slug', 'secret', '--title', 'private', '--description', 'private', '--content', 'private')
        for path in ('.harness/memory/users/AGENTS.md', '.harness/memory/users/user_secret.md'):
            result = subprocess.run(['git', '-C', str(self.root), 'check-ignore', path], capture_output=True)
            self.assertEqual(result.returncode, 0)

    def test_doctor_discovers_scope_inside_harness_module(self):
        self.init('--memory-types', 'project')
        child = self.root / '.harness/evaluation/suite'
        child.mkdir(parents=True)
        self.run_cli('init', '--root-dir', str(child), '--skill-types', 'managed', target=child)
        report = self.run_cli('doctor', '--root-dir', str(self.root), '--apply')
        self.assertIn('.harness/evaluation/suite', report['memoryDirs'])
        self.assertIn('.harness/evaluation/suite/AGENTS.md', (self.root / 'AGENTS.md').read_text())
        self.assertFalse(report['remaining'])

    def test_unreadable_source_preserves_previous_index(self):
        self.write_skill(self.root / '.agents/skills/one/SKILL.md')
        self.init('--skill-types', 'referenced')
        index = self.root / '.harness/skills/referenced/AGENTS.md'
        original = index.read_bytes()
        source = self.root / '.agents/skills/one/SKILL.md'
        source.chmod(0)
        self.addCleanup(lambda: source.chmod(0o600))
        result = self.init()
        self.assertFalse(result['complete'])
        self.assertEqual(index.read_bytes(), original)

    def test_missing_source_is_not_successful_empty_scan(self):
        result = self.init('--skill-types', 'referenced')
        self.assertFalse(result['complete'])
        self.assertTrue(result['diagnostics'])
        (self.root / '.agents/skills').mkdir(parents=True)
        result = self.init()
        self.assertTrue(result['complete'])

    def test_child_init_preflights_legacy_root_before_creating_files(self):
        (self.root / '.memory').mkdir()
        child = self.root / 'child'
        child.mkdir()
        self.run_cli('init', '--root-dir', str(self.root), '--memory-types', 'project', target=child, ok=False)
        self.assertEqual(list(child.iterdir()), [])

    def test_doctor_preserves_manual_text_and_child_description_when_rehoming(self):
        self.init('--memory-types', 'project')
        child = self.root / 'mid/child'
        child.mkdir(parents=True)
        self.init('--memory-types', 'project', '--description', 'specific child responsibility', target=child)
        # Create the middle scope independently, then let doctor repair registrations.
        middle = child.parent
        self.run_cli('init', '--root-dir', str(middle), '--memory-types', 'project', target=middle)
        agents = self.root / 'AGENTS.md'
        agents.write_text(agents.read_text() + '\n\n\nManual tail\n\n')
        self.run_cli('doctor', '--apply')
        self.assertTrue(agents.read_text().endswith('\n\n\nManual tail\n\n'))
        self.assertIn('specific child responsibility', (middle / 'AGENTS.md').read_text())

    def test_managed_aliases_within_same_type_are_deduplicated(self):
        self.init('--skill-types', 'managed')
        self.write_skill(self.root / '.harness/skills/managed/original/SKILL.md')
        (self.root / '.harness/skills/managed/alias').symlink_to('original', target_is_directory=True)
        result = self.init()
        self.assertTrue(result['complete'], result)
        index = (self.root / '.harness/skills/managed/AGENTS.md').read_text()
        self.assertEqual(index.count(' — example'), 1)

    def test_referenced_format_problem_is_reported_without_editing_source(self):
        path = self.root / '.agents/skills/bad/SKILL.md'
        path.parent.mkdir(parents=True)
        path.write_text('No frontmatter\n')
        self.init('--skill-types', 'referenced')
        result = self.run_cli('doctor', '--apply')
        self.assertTrue(any(f['code'] == 'invalid-entry' for f in result['remaining']))
        self.assertEqual(path.read_text(), 'No frontmatter\n')

    def test_old_names_are_not_runtime_aliases(self):
        self.init('--skill-types', 'managed')
        self.run_cli('remember', '--type', 'skills', '--slug', 'example', '--description', 'x', '--content', 'x', ok=False)
        self.run_cli('add-type', '--name', 'skills', '--description', 'custom ordinary type')
        self.run_cli('remember', '--type', 'skills', '--slug', 'example', '--title', 'x', '--description', 'x', '--content', 'x')
        self.assertTrue((self.root / '.harness/memory/skills/skills_example.md').is_file())

    def test_missing_adopted_index_is_restored_without_adding_types(self):
        self.init('--memory-types', 'project')
        path = self.root / '.harness/memory/projects/AGENTS.md'
        path.unlink()
        report = self.run_cli('doctor', '--apply')
        self.assertFalse(report['remaining'])
        self.assertTrue(path.is_file())
        self.assertFalse((self.root / '.harness/memory/users').exists())

    def test_remember_reestablishes_private_ignore_before_writing(self):
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.init('--memory-types', 'user')
        (self.root / '.gitignore').unlink()
        self.run_cli('remember', '--type', 'user', '--slug', 'secret', '--title', 'private', '--description', 'private', '--content', 'private')
        result = subprocess.run(['git', '-C', str(self.root), 'check-ignore', '.harness/memory/users/user_secret.md'], capture_output=True)
        self.assertEqual(result.returncode, 0)

    def test_doctor_restores_missing_adopted_type_directory(self):
        self.init('--memory-types', 'project')
        path = self.root / '.harness/memory/projects'
        (path / 'AGENTS.md').unlink()
        path.rmdir()
        report = self.run_cli('doctor', '--apply')
        self.assertFalse(report['remaining'], report)
        self.assertTrue((path / 'AGENTS.md').is_file())

    def test_foreign_agents_append_preserves_original_bytes(self):
        original = '# Business\n\nManual body\n\n\n'
        agents = self.root / 'AGENTS.md'
        agents.write_text(original)
        self.init('--memory-types', 'project')
        self.assertEqual(agents.read_text(), original)
        self.run_cli('doctor', '--apply')
        self.assertTrue(agents.read_text().startswith(original))

    def test_duplicate_child_repair_preserves_custom_children_prose(self):
        self.init('--memory-types', 'project')
        child = self.root / 'child'
        child.mkdir()
        self.init('--memory-types', 'project', '--description', 'child meaning', target=child)
        agents = self.root / 'AGENTS.md'
        text = agents.read_text()
        line = next(line for line in text.splitlines() if '](child/AGENTS.md)' in line)
        agents.write_text(text.replace(line, 'Manual child guidance\n' + line + '\n' + line))
        report = self.run_cli('doctor', '--apply')
        self.assertFalse(report['remaining'], report)
        self.assertEqual(agents.read_text().count('](child/AGENTS.md)'), 1)
        self.assertIn('Manual child guidance', agents.read_text())
        self.assertIn('child meaning', agents.read_text())

    def test_missing_custom_metadata_is_not_replaced_with_default_permissions(self):
        self.init('--memory-types', 'project')
        self.run_cli('add-type', '--name', 'secret', '--description', 'private', '--gitignore', '--index-only')
        index = self.root / '.harness/memory/secrets/AGENTS.md'
        index.unlink()
        report = self.run_cli('doctor', '--apply')
        self.assertTrue(report['remaining'])
        self.assertFalse(index.exists())

    def test_malformed_privilege_metadata_rejects_before_writes(self):
        self.init('--memory-types', 'project')
        self.run_cli('add-type', '--name', 'secret', '--description', 'private', '--index-only')
        index = self.root / '.harness/memory/secrets/AGENTS.md'
        index.write_text(index.read_text().replace('writable: false', 'writable: maybe'))
        self.run_cli('remember', '--type', 'secret', '--slug', 'x', '--title', 'x', '--description', 'x', '--content', 'x', ok=False)
        self.assertFalse((index.parent / 'secret_x.md').exists())

    def test_user_metadata_cannot_disable_private_boundary(self):
        self.init('--memory-types', 'user')
        index = self.root / '.harness/memory/users/AGENTS.md'
        index.write_text(index.read_text() + '\n<!-- project-memory-type:start -->\nname: user\ngitignore: false\n<!-- project-memory-type:end -->\n')
        self.run_cli('remember', '--type', 'user', '--slug', 'secret', '--title', 'x', '--description', 'x', '--content', 'x', ok=False)
        self.assertFalse((index.parent / 'user_secret.md').exists())

    def test_custom_plural_path_collision_does_not_replace_existing_type(self):
        self.init('--memory-types', 'project')
        self.run_cli('add-type', '--name', 'docs', '--description', 'documents')
        index = self.root / '.harness/memory/docs/AGENTS.md'
        original = index.read_bytes()
        self.run_cli('add-type', '--name', 'doc', '--description', 'different identity', ok=False)
        self.assertEqual(index.read_bytes(), original)

    def test_repeated_add_type_reports_preserved_privileges(self):
        self.init('--memory-types', 'project')
        self.run_cli('add-type', '--name', 'secret', '--description', 'private', '--gitignore', '--index-only')
        result = self.run_cli('add-type', '--name', 'secret', '--description', 'private')
        self.assertTrue(result['flags']['gitignore'])
        self.assertFalse(result['flags']['writable'])

    def test_removed_custom_metadata_cannot_restore_public_write_defaults(self):
        import re
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.init('--memory-types', 'project')
        # Use an already plural name so its identity does not change on fallback.
        self.run_cli('add-type', '--name', 'secrets', '--description', 'private', '--gitignore', '--index-only')
        index = self.root / '.harness/memory/secrets/AGENTS.md'
        stripped = re.sub(r'<!-- project-memory-type:start -->.*?<!-- project-memory-type:end -->\n?', '', index.read_text(), flags=re.DOTALL)
        index.write_text(stripped)
        index.chmod(0o600)
        (self.root / '.gitignore').unlink()
        original_index = index.read_bytes()
        original_agents = (self.root / 'AGENTS.md').read_bytes()
        for arguments in [
            ('remember', '--type', 'secrets', '--slug', 'leak', '--title', 'private', '--description', 'private', '--content', 'private'),
            ('init', '--memory-types', 'feedback'),
        ]:
            with self.subTest(operation=arguments[0]):
                self.run_cli(*arguments, ok=False)
                self.assertEqual(index.read_bytes(), original_index)
                self.assertEqual(index.stat().st_mode & 0o777, 0o600)
                self.assertEqual((self.root / 'AGENTS.md').read_bytes(), original_agents)
                self.assertFalse((index.parent / 'secrets_leak.md').exists())
                self.assertFalse((self.root / '.gitignore').exists())
                self.assertFalse((self.root / '.harness/memory/feedbacks').exists())
        report = self.run_cli('doctor', '--apply')
        self.assertTrue(any(f['code'] == 'unsafe-layout' for f in report['remaining']))
        self.assertEqual(index.read_bytes(), original_index)

    def test_managed_metadata_cannot_change_format_or_writability(self):
        self.init('--skill-types', 'managed')
        self.run_cli('remember', '--type', 'managed', '--slug', 'keep-it', '--description', 'keep', '--content', 'Existing body')
        index = self.root / '.harness/skills/managed/AGENTS.md'
        body = index.parent / 'keep-it/SKILL.md'
        original_body = body.read_bytes()
        original_index = index.read_text()
        for format_value, writable in [('ordinary', 'true'), ('skills', 'false')]:
            with self.subTest(format=format_value, writable=writable):
                index.write_text(original_index + '\n<!-- project-memory-type:start -->\nname: managed\nmodule: skills\nformat: ' + format_value + '\nwritable: ' + writable + '\n<!-- project-memory-type:end -->\n')
                index.chmod(0o600)
                malformed = index.read_bytes()
                self.run_cli('init', ok=False)
                self.run_cli('remember', '--type', 'managed', '--slug', 'other', '--title', 'other', '--description', 'other', '--content', 'Other body', ok=False)
                report = self.run_cli('doctor', '--apply')
                self.assertTrue(any(f['code'] == 'unsafe-layout' for f in report['remaining']))
                self.assertEqual(index.read_bytes(), malformed)
                self.assertEqual(index.stat().st_mode & 0o777, 0o600)
                self.assertEqual(body.read_bytes(), original_body)
                self.assertFalse((index.parent / 'managed_other.md').exists())
                self.assertFalse((index.parent / 'other/SKILL.md').exists())

    def test_unterminated_frontmatter_is_invalid_and_body_is_preserved(self):
        source = self.root / '.agents/skills/unfinished/SKILL.md'
        source.parent.mkdir(parents=True)
        source.write_text('---\nname: unfinished\ndescription: Looks valid but never closed\nBody text\n')
        source.chmod(0o600)
        original = source.read_bytes()
        self.init('--skill-types', 'referenced')
        for apply in [False, True]:
            with self.subTest(apply=apply):
                args = ('doctor', '--apply') if apply else ('doctor',)
                report = self.run_cli(*args)
                self.assertTrue(any(f['code'] == 'invalid-entry' for f in report['remaining']))
                self.assertEqual(source.read_bytes(), original)
                self.assertEqual(source.stat().st_mode & 0o777, 0o600)
