"""Offline checks of v2 provenance, dependencies and reproducible artifacts."""
from copy import deepcopy
import json
from pathlib import Path
import sys
from unittest import mock

import tempfile
import unittest

HARBOR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HARBOR))
from synthetic.v2 import generate as g
from synthetic.v2.oracle import expected_memory_ids, resolve


class NaturalSyntheticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = g.build_dataset()

    def test_exact_matrix_and_split_identity(self):
        data = self.data
        result = g.validate_synthetic(data)
        assert result['family_matrix'] == g.MATRIX
        assert result['scope_matrix'] == {'dev': {'root': 8, 'repository': 3, 'deep': 1},
                                          'test': {'root': 24, 'repository': 8, 'deep': 4}}
        assert len(data['memories']) == 336
        assert len(data['cases']) == 48
        assert all(c['source']['kind'] == 'synthetic' for c in data['cases'])
        assert all(m['source']['kind'] == 'synthetic' for m in data['memories'])
        assert sum(c['coverage_role'] == 'targeted_stress' for c in data['cases']) == 5
        sessions = [{c['source']['session_id'] for c in data['cases'] if c['split'] == s} for s in ('dev', 'test')]
        assert not sessions[0] & sessions[1]


    def test_repeat_bytes_and_seed_changes_only_id_placement(self):
        data = self.data
        assert g.encoded(data) == g.encoded(g.build_dataset())
        another = g.build_dataset(g.DEFAULT_SEED + 1)
        assert g.encoded(data) != g.encoded(another)
        assert {c['case_id'] for c in data['cases']}.isdisjoint(c['case_id'] for c in another['cases'])
        assert [c['question'] for c in data['cases']] == [c['question'] for c in another['cases']]
        assert [len(c['gold_memory_ids']) for c in data['cases']] == [len(c['gold_memory_ids']) for c in another['cases']]
        assert all(c['gold_memory_ids'] == sorted(c['gold_memory_ids']) for c in data['cases'])


    def test_build_reads_no_external_files_or_model(self):
        data = self.data
        # Imports are complete before patching; generation is a pure transform of constants.
        with mock.patch.object(Path, 'read_text', side_effect=AssertionError('external read')), \
             mock.patch.object(Path, 'read_bytes', side_effect=AssertionError('external read')), \
             mock.patch('builtins.open', side_effect=AssertionError('external read')):
            assert g.encoded(g.build_dataset()) == g.encoded(data)


    def test_question_words_never_drive_oracle(self):
        data = self.data
        truth = data['scene_truth']
        case = deepcopy(next(c for c in truth['cases'] if not c['negative']))
        expected = expected_memory_ids(truth, case)
        case['question'] = 'Completely different text; oracle cannot read this.'
        assert expected_memory_ids(truth, case) == expected


    def test_gold_tampering_and_duplicate_ids_rejected(self):
        data = self.data
        changed = deepcopy(data)
        changed['cases'][0]['gold_memory_ids'] = []
        with self.assertRaisesRegex(ValueError, 'gold differs'):
            g.validate_synthetic(changed)
        changed = deepcopy(data)
        changed['memories'][1]['memory_id'] = changed['memories'][0]['memory_id']
        with self.assertRaises(ValueError):
            g.validate_synthetic(changed)


    def test_dependency_is_required_not_just_root_rule(self):
        data = self.data
        truth = deepcopy(data['scene_truth'])
        case = next(c for c in truth['cases'] if c['scenario_family'] == 'multihop_plan')
        chosen = resolve(truth, case)['rule_ids']
        rules = {r['rule_id']: r for r in truth['rules']}
        assert any(rules[rid]['requires'] for rid in chosen)
        assert len(chosen) > len(case['obligations'])
        root = next(rules[rid] for rid in chosen if rules[rid]['requires'])
        root['requires'].append(root['unit'])
        with self.assertRaisesRegex(ValueError, 'cyclic'):
            resolve(truth, case)


    def test_condition_flip_changes_winner_without_question_matching(self):
        data = self.data
        truth = data['scene_truth']
        case = deepcopy(next(c for c in truth['cases'] if c['scenario_family'] == 'conditional_override'))
        original = expected_memory_ids(truth, case)
        alternative = next(r for r in truth['rules'] if r['scene_id'] == case['scene_id'] and r['variant'] == 'other_condition')
        case['facts']['phase'] = 'facilitated_training'
        changed = expected_memory_ids(truth, case)
        assert changed != original
        assert alternative['memory_id'] in changed


    def test_unavailable_and_future_rules_excluded(self):
        data = self.data
        truth = deepcopy(data['scene_truth'])
        case = next(c for c in truth['cases'] if not c['negative'])
        future = next(r for r in truth['rules'] if r['scene_id'] == case['scene_id'] and r['variant'] == 'future_effective')
        assert resolve(truth, case)['exclusions'][future['rule_id']] == 'not_yet_effective'
        case['query_at'] = '2025-09-02T09:00:00Z'
        assert future['memory_id'] in expected_memory_ids(truth, case)
        # Strict availability: an otherwise current rule appearing exactly at query time is invisible.
        current = next(r for r in truth['rules'] if r['scene_id'] == case['scene_id'] and r['variant'] == 'current')
        current['available_at'] = case['query_at']
        assert resolve(truth, case)['exclusions'][current['rule_id']] == 'not_available_before_query'


    def test_oracle_never_truncates_gold(self):
        data = self.data
        truth = deepcopy(data['scene_truth'])
        case = next(c for c in truth['cases'] if not c['negative'])
        base = next(r for r in truth['rules'] if r['scene_id'] == case['scene_id'] and r['variant'] == 'current')
        for number in range(6):
            rule = deepcopy(base)
            rule.update(rule_id=f'new-rule-{number}', memory_id=f'new-memory-{number}', unit=f'extra-{number}', requires=[])
            truth['rules'].append(rule)
            case['obligations'].append(rule['unit'])
        assert len(expected_memory_ids(truth, case)) > 5


    def test_body_or_scope_changes_fail_truth_validation(self):
        data = self.data
        for key, value in [('body', '篡改正文'), ('scope', 'another-place')]:
            changed = deepcopy(data)
            changed['memories'][0][key] = value
            with self.assertRaisesRegex(ValueError, 'memory differs'):
                g.validate_synthetic(changed)


    def test_write_idempotence_and_refuses_partial_overwrite(self):
        data = self.data
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        tmp_path = Path(temporary.name)
        hashes = g.write_artifacts(data, tmp_path)
        assert g.write_artifacts(data, tmp_path) == hashes
        manifest = json.loads((tmp_path / 'BUILD_MANIFEST.json').read_text())
        build_sha = manifest.pop('build_sha256')
        assert build_sha == g.sha(g.encoded(manifest))
        for name, expected in manifest['artifacts_sha256'].items():
            assert g.sha((tmp_path / name).read_bytes()) == expected
        (tmp_path / 'DATA_REPORT.md').write_text('different')
        (tmp_path / 'data-v2.json').unlink()
        with self.assertRaisesRegex(ValueError, 'refusing to overwrite'):
            g.write_artifacts(data, tmp_path)
        assert not (tmp_path / 'data-v2.json').exists()

    def test_body_does_not_render_oracle_classification(self):
        for memory in self.data['memories']:
            for marker in ('audience=', 'phase=', '此条用于', '存档位置', '。。'):
                self.assertNotIn(marker, memory['body'])
        case = next(c for c in self.data['scene_truth']['cases'] if c['entity'] == '白汐展馆')
        self.assertEqual(case['facts']['audience'], 'volunteers')
        self.assertEqual(case['facts']['requester_role'], 'staff')

    def test_unresolved_positive_dependency_rejected(self):
        changed = deepcopy(self.data)
        scene = next(c for c in changed['scene_truth']['cases'] if not c['negative'])
        scene['obligations'].append('missing-required-evidence')
        with self.assertRaisesRegex(ValueError, 'unresolved evidence'):
            g.validate_synthetic(changed)

    def test_ambiguous_precedence_rejected(self):
        truth = deepcopy(self.data['scene_truth'])
        case = next(c for c in truth['cases'] if not c['negative'])
        rule = deepcopy(next(r for r in truth['rules'] if r['scene_id'] == case['scene_id'] and r['variant'] == 'current'))
        rule.update(rule_id='duplicate-priority', memory_id='duplicate-memory')
        truth['rules'].append(rule)
        with self.assertRaisesRegex(ValueError, 'ambiguous'):
            resolve(truth, case)


if __name__ == '__main__':
    unittest.main()
