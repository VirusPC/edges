"""Instance fixtures exercise byte preservation, routing, recovery and private remnants."""
import hashlib
import importlib.util
import json
import stat
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('migrate-recursive-layout.py')

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

class InstanceMigrationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.git('init', '-q')
        self.put('AGENTS.md', '# root\n<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n<!-- project-memory-children:end -->\n<!-- project-memory:end -->\n')
        self.put('.gitignore', '**/.memory/users/\n**/.harness/memory/users/\n')
        self.put('knowledge/posts/README.md', '# protected\n')
        self.put('knowledge/teaching/lesson/page.md', '[asset](asset.png)\n[task](../../tasks/demo/backlog/domain.md)\n')
        self.put('knowledge/teaching/lesson/asset.png', 'asset')
        self.put('knowledge/tasks/demo/AGENTS.md', '# authored project\n')
        self.put('knowledge/tasks/AGENTS.md', '# board manual instructions\n')
        self.put('knowledge/tasks/demo/backlog/domain.md', '# domain\n')
        self.put('knowledge/tasks/demo/backlog/.domain.log.md', '# run\n')
        self.put('knowledge/tasks/demo/backlog/maintenance.md', '# maintenance\n')
        self.put('evaluation/README.md', '[lesson](../knowledge/teaching/lesson/page.md)\n')
        self.put('observation/README.md', '# Observation\nCurrent duties.\n')
        self.put('.gitmodules', '[submodule "evaluation/third_party/locomo"]\n\tpath = evaluation/third_party/locomo\n\turl = https://example.com/locomo.git\n')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'fixture')
        pin = self.git('rev-parse', 'HEAD').strip()
        self.git('update-index', '--add', '--cacheinfo', '160000,' + pin + ',evaluation/third_party/locomo')
        self.manifest = {'tasks': [], 'localMemoryRecords': [], 'taskAssets': [], 'protectedPostHashes': {'knowledge/posts/README.md': digest(self.root/'knowledge/posts/README.md')}, 'gitlink': {'source': 'evaluation/third_party/locomo', 'target': '.harness/evaluation/third_party/locomo', 'sha': pin}}
        for stem, prefix in [('domain','tasks'), ('maintenance','.harness/tasks')]:
            old=f'knowledge/tasks/demo/backlog/{stem}.md'
            side=f'knowledge/tasks/demo/backlog/.{stem}.log.md'
            self.manifest['tasks'].append({'source':old, 'target':f'{prefix}/demo/backlog/{stem}.md', 'sha256':digest(self.root/old), 'purpose':stem, 'sidecar': {'source':side,'target':f'{prefix}/demo/backlog/.{stem}.log.md','sha256':digest(self.root/side)} if (self.root/side).exists() else None})
        self.put('manifest.json', json.dumps(self.manifest))
    def put(self, rel, text):
        path=self.root/rel; path.parent.mkdir(parents=True,exist_ok=True); path.write_text(text)
    def git(self,*args):
        return subprocess.check_output(['git','-C',str(self.root),*args],text=True)
    def run_script(self,*args):
        self.assertTrue(SCRIPT.exists(), 'instance migration implementation is missing')
        return subprocess.run(['python3',str(SCRIPT),'--worktree',str(self.root),'--manifest','manifest.json',*args],capture_output=True,text=True)
    def snapshot(self):
        return {str(p.relative_to(self.root)):digest(p) for p in self.root.rglob('*') if p.is_file() and '.git' not in p.parts}
    def test_dry_run_apply_and_repeat_preserve_business_content(self):
        before=self.snapshot(); dry=self.run_script('--dry-run'); self.assertEqual(dry.returncode,0,dry.stderr); self.assertEqual(before,self.snapshot())
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        for item in self.manifest['tasks']:
            self.assertFalse((self.root/item['source']).exists()); self.assertEqual(digest(self.root/item['target']),item['sha256'])
        self.assertTrue((self.root/'tasks/demo/AGENTS.md').exists()); self.assertTrue((self.root/'.harness/tasks/demo/AGENTS.md').exists())
        self.assertEqual(digest(self.root/'knowledge/posts/README.md'),self.manifest['protectedPostHashes']['knowledge/posts/README.md'])
        self.assertIn('Current duties.',(self.root/'.harness/observation/AGENTS.md').read_text())
        self.assertIn('../../tasks/demo/backlog/domain.md',(self.root/'teaching/lesson/page.md').read_text())
        self.git('add','-A')
        self.assertIn(self.manifest['gitlink']['sha'], self.git('ls-files','--stage','.harness/evaluation/third_party/locomo'))
        after=self.snapshot(); repeated=self.run_script('--apply'); self.assertEqual(repeated.returncode,0,repeated.stderr); self.assertEqual(after,self.snapshot())
    def test_conflict_is_reported_before_any_mutation(self):
        self.put('tasks/demo/backlog/domain.md','conflict'); before=self.snapshot()
        result=self.run_script('--apply'); self.assertNotEqual(result.returncode,0); self.assertEqual(before,self.snapshot())
    def test_unknown_private_owner_is_reported_before_mutation(self):
        self.put('unknown/.memory/users/private.md','do not report this body'); before=self.snapshot()
        result=self.run_script('--apply'); self.assertNotEqual(result.returncode,0); self.assertEqual(before,self.snapshot()); self.assertNotIn('do not report this body',result.stdout+result.stderr)
    def test_publicly_upgraded_checkout_routes_ignored_remnants_without_new_scope(self):
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        old=self.root/'tasks/demo/backlog/domain.md'
        moved=self.root/'tasks/demo/done/domain.md'; moved.parent.mkdir(parents=True); old.rename(moved)
        self.put('.harness/memory/users/AGENTS.md','# private index\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n')
        self.put('extensions/.memory/users/private.md','private body')
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual((self.root/'.harness/memory/users/private.md').read_text(),'private body')
        self.assertFalse((self.root/'extensions/.harness').exists())
        self.assertFalse((self.root/'extensions/.memory/users/private.md').exists())
        self.git('check-ignore','.harness/memory/users/private.md')

    def test_private_index_metadata_is_converted_without_losing_manual_text(self):
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.put('extensions/AGENTS.md','# module constraints\n')
        self.put('extensions/.memory/users/AGENTS.md','# private manual\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n')
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        text=(self.root/'.harness/memory/users/AGENTS.md').read_text()
        self.assertIn('gitignore: true',text); self.assertIn('private manual',text)

    def test_generic_conversion_consolidates_indexes_and_keeps_introductions(self):
        for owner, title in [('', 'root intro'), ('extensions/', 'module intro')]:
            self.put(owner+'.memory/projects/AGENTS.md', '# Projects\n'+title+'\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n')
            self.put(owner+'AGENTS.md', '# scope\n<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n- [projects](.memory/projects/AGENTS.md) — projects\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n<!-- project-memory-children:end -->\n<!-- project-memory:end -->\n')
        body='---\nname: project_example\ndescription: example\n---\nbody\n'
        self.put('extensions/.memory/projects/project_example.md',body)
        self.manifest['localMemoryRecords']=[{'source':'extensions/.memory/projects/project_example.md','target':'.harness/memory/projects/project_example.md','sha256':digest(self.root/'extensions/.memory/projects/project_example.md')}]
        self.put('manifest.json',json.dumps(self.manifest))
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        index=(self.root/'.harness/memory/projects/AGENTS.md').read_text()
        self.assertIn('root intro',index); self.assertIn('module intro',index)
        self.assertEqual(index.count('<!-- project-memory-type:start -->'),1)
        self.assertNotIn('<!-- project-memory:start -->',(self.root/'extensions/AGENTS.md').read_text())
        self.assertFalse((self.root/'extensions/.memory').exists())

    def legacy_indexes(self, root_fields, module_fields, root_header='', module_header=''):
        for owner, fields, header in [('',root_fields,root_header),('extensions/',module_fields,module_header)]:
            index = ('<!-- project-memory-type:start -->\nname: project\n' + fields +
                     '<!-- project-memory-type:end -->\n\n' + header +
                     '# authored intro\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n')
            self.put(owner+'.memory/projects/AGENTS.md',index)
            self.put(owner+'AGENTS.md','# owner\n<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n- [projects](.memory/projects/AGENTS.md) — projects\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n<!-- project-memory-children:end -->\n<!-- project-memory:end -->\n')

    def test_consolidation_preserves_compatible_unknown_metadata_and_frontmatter(self):
        self.legacy_indexes('shared-field: same\nroot-field: root-value\n',
                            'shared-field: same\ncustom-field: module-value\n',
                            '---\nroot-note: root-value\n---\n',
                            '---\nmodule-note: module-value\nnested-note:\n  detail: preserve-value\n---\n')
        before=self.snapshot(); dry=self.run_script('--dry-run')
        self.assertEqual(dry.returncode,0,dry.stderr); self.assertEqual(before,self.snapshot())
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        text=(self.root/'.harness/memory/projects/AGENTS.md').read_text()
        for field in ('root-field: root-value','custom-field: module-value','root-note: root-value','module-note: module-value','nested-note:\n  detail: preserve-value'):
            self.assertIn(field,text)
        self.assertEqual(text.count('shared-field: same'),1)
        self.assertEqual(text.count('<!-- project-memory-type:start -->'),1)

    def test_conflicting_unknown_metadata_rejects_before_any_write(self):
        self.legacy_indexes('custom-field: root-value\n','custom-field: module-value\n')
        before=self.snapshot(); result=self.run_script('--apply')
        self.assertNotEqual(result.returncode,0); self.assertIn('metadata-conflict',result.stderr)
        self.assertEqual(before,self.snapshot())
        self.assertFalse((self.root/'.recursive-layout-migration').exists())
        self.assertFalse((self.root/'.harness').exists())

    def test_conflicting_frontmatter_rejects_before_any_write(self):
        self.legacy_indexes('','', '---\ncustom-field: root-value\n---\n', '---\ncustom-field: module-value\n---\n')
        before=self.snapshot(); result=self.run_script('--apply')
        self.assertNotEqual(result.returncode,0); self.assertIn('metadata-conflict',result.stderr)
        self.assertEqual(before,self.snapshot()); self.assertFalse((self.root/'.recursive-layout-migration').exists())

    def test_quoted_frontmatter_conflict_rejects_before_any_write(self):
        self.legacy_indexes('', '',
                            '---\nroot-note: root\n"custom-field": root-value\n---\n',
                            '---\nmodule-note: module\n"custom-field": module-value\n---\n')
        before=self.snapshot(); result=self.run_script('--apply')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('index-metadata-structure-needs-review',result.stderr)
        self.assertEqual(before,self.snapshot())
        self.assertFalse((self.root/'.recursive-layout-migration').exists())
        self.assertFalse((self.root/'.harness').exists())

    def assert_unsupported_metadata_key_rejected(self, key):
        self.legacy_indexes('', '',
                            '---\nroot-note: root\n'+key+': root-value\n---\n',
                            '---\nmodule-note: module\n'+key+': module-value\n---\n')
        before=self.snapshot(); result=self.run_script('--apply')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('index-metadata-structure-needs-review',result.stderr)
        self.assertEqual(before,self.snapshot())
        self.assertFalse((self.root/'.recursive-layout-migration').exists())
        self.assertFalse((self.root/'.harness').exists())

    def test_single_quoted_key_cannot_hide_as_continuation(self):
        self.assert_unsupported_metadata_key_rejected("'custom-field'")

    def test_non_ascii_key_cannot_hide_as_continuation(self):
        self.assert_unsupported_metadata_key_rejected('自定义字段')

    def test_private_directory_modes_exist_before_any_private_copy(self):
        from unittest.mock import patch
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.put('extensions/AGENTS.md','# module constraints\n')
        self.put('extensions/.memory/users/AGENTS.md','# private\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n')
        self.put('extensions/.memory/users/assets/private.bin','private bytes')
        for rel in ('extensions/.memory/users','extensions/.memory/users/assets'):
            (self.root/rel).chmod(0o700)
        # A pre-existing public destination directory must be tightened too.
        (self.root/'.harness/memory/users').mkdir(parents=True,exist_ok=True)
        (self.root/'.harness/memory/users').chmod(0o755)
        spec=importlib.util.spec_from_file_location('instance_modes',SCRIPT)
        module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        original=module.generic.write_state; copied=[]
        def inspect_copy(path,value):
            if '/.harness/memory/users/' in str(path):
                copied.append(path)
                for rel in ('.harness/memory/users','.harness/memory/users/assets'):
                    folder=self.root/rel
                    self.assertTrue(folder.is_dir(),'private directory absent before copy')
                    self.assertEqual(stat.S_IMODE(folder.stat().st_mode),0o700,'private directory permissions before copy')
                self.git('check-ignore',str(path))
            return original(path,value)
        with patch.object(module.generic,'write_state',side_effect=inspect_copy):
            module.run(self.root,self.manifest,True)
        self.assertTrue(copied)
        for rel in ('.harness/memory/users','.harness/memory/users/assets'):
            self.assertEqual(stat.S_IMODE((self.root/rel).stat().st_mode),0o700)
        after=self.snapshot(); result=self.run_script('--apply')
        self.assertEqual(result.returncode,0,result.stderr); self.assertEqual(after,self.snapshot())

    def test_flat_private_index_gets_private_directory_before_copy(self):
        from unittest.mock import patch
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.put('.memory/USER.md','# flat private\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n')
        spec=importlib.util.spec_from_file_location('instance_flat_modes',SCRIPT)
        module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        original=module.generic.write_state; copied=[]
        def inspect_copy(path,value):
            if path.name=='AGENTS.md' and '/.harness/memory/users/' in str(path):
                copied.append(path)
                self.assertTrue(path.parent.is_dir(),'private directory absent before flat-index copy')
                self.assertEqual(stat.S_IMODE(path.parent.stat().st_mode),0o700)
            return original(path,value)
        with patch.object(module.generic,'write_state',side_effect=inspect_copy):
            module.run(self.root,self.manifest,True)
        self.assertTrue(copied)

    def test_private_remnant_root_and_module_links_keep_original_targets(self):
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.put('README.md','# root reference\n'); self.put('extensions/README.md','# module reference\n')
        self.put('extensions/AGENTS.md','# module constraints\n')
        for owner in ('','extensions/'):
            with self.subTest(owner=owner):
                index=owner+'.memory/users/AGENTS.md'
                self.put(index,'# private\n[reference](../../README.md)\n<!-- project-memory-entries:start -->\n- [private](user_private.md) — record\n<!-- project-memory-entries:end -->\n')
                self.put(owner+'.memory/users/user_private.md','[reference](../../README.md)\n[index](AGENTS.md)\n')
                result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
                expected='../../../'+owner+'README.md'
                for rel in ('AGENTS.md','user_private.md'):
                    target=self.root/'.harness/memory/users'/rel
                    self.assertIn('[reference]('+expected+')',target.read_text())
                    self.assertEqual((target.parent/expected).resolve(),(self.root/owner/'README.md').resolve())
                self.assertIn('[private](user_private.md)',(self.root/'.harness/memory/users/AGENTS.md').read_text())
                # Separate owners each exercise a fresh private index, not an authorized merge.
                for path in (self.root/'.harness/memory/users').iterdir(): path.unlink()

    def test_interrupted_copy_resumes_and_preserves_newer_edits(self):
        import sys
        from unittest.mock import patch
        sys.path.insert(0,str(SCRIPT.parent))
        spec=importlib.util.spec_from_file_location('instance_migration',SCRIPT)
        module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        original=module.generic.write_state; count=[0]
        def interrupted(path,value):
            if path.suffix=='.md':
                count[0]+=1
                if count[0]==3: raise OSError('fixture interruption')
            return original(path,value)
        with patch.object(module.generic,'write_state',side_effect=interrupted):
            with self.assertRaisesRegex(OSError,'fixture interruption'):
                module.run(self.root,self.manifest,True)
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.put('tasks/demo/backlog/domain.md','new task content')
        result=self.run_script('--apply'); self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual((self.root/'tasks/demo/backlog/domain.md').read_text(),'new task content')

if __name__=='__main__': unittest.main()
