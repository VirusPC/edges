import unittest
from synthetic.v2.diagnose_run import require_synthetic, score_rows, summaries


class QualityDiagnosticsTests(unittest.TestCase):
    def fixture(self, gold):
        case = {'case_id': 'c', 'gold_memory_ids': gold, 'source': {'kind': 'synthetic'},
                'query_at': '2025-01-02T00:00:00Z', 'scenario_family': 'natural',
                'coverage': {'scope_start': 'root', 'coverage_role': 'source_informed'}}
        memories = [{'memory_id': mid, 'source': {'kind': 'synthetic'},
                     'available_at': '2025-01-01T00:00:00Z'} for mid in ('a', 'b')]
        return {'source': {'kind': 'synthetic'}, 'cases': [case], 'memories': memories}, case

    def row(self, condition='root', selected=('a',), observed=('a',), recall=1., error=None):
        return {'case_id': 'c', 'condition': condition, 'repeat': 1, 'error': error,
                'selected_memory_ids': list(selected), 'observed_memory_ids': list(observed),
                'selected_recall_at_5': recall, 'evidence_recall_at_5': recall}

    def test_full_recall_can_hide_false_positive(self):
        data, case = self.fixture(['a'])
        row = score_rows(data, [case], [self.row(selected=('a', 'b'))])[0]
        self.assertEqual(row['recall_at_5'], 1)
        self.assertEqual(row['selected_precision'], .5)
        self.assertEqual(row['selected_set_exact'], 0)
        self.assertEqual(row['extra_selected_count'], 1)

    def test_negative_abstention_exact_but_precision_undefined(self):
        data, case = self.fixture([])
        row = score_rows(data, [case], [self.row(selected=(), observed=(), recall=None)])[0]
        self.assertEqual(row['evidence_set_exact'], 1)
        self.assertIsNone(row['selected_precision'])
        self.assertIsNone(row['recall_at_5'])

    def test_failed_quality_stays_missing(self):
        data, case = self.fixture(['a'])
        row = score_rows(data, [case], [self.row(error='native:failed', recall=None)])[0]
        self.assertIsNone(row['selected_set_exact'])
        self.assertEqual(summaries([row], [case], [row])['all']['root']['failures'], 1)

    def test_none_cannot_gain_credit_from_guessed_id(self):
        data, case = self.fixture(['a'])
        row = score_rows(data, [case], [self.row(condition='none', recall=0)])[0]
        self.assertEqual(row['selected_set_exact'], 0)
        self.assertEqual(row['selected_precision'], 0)

    def test_mixed_provenance_and_score_mismatch_are_rejected(self):
        data, case = self.fixture(['a'])
        with self.assertRaisesRegex(ValueError, 'recall differs'):
            score_rows(data, [case], [self.row(recall=.5)])
        data['memories'][0]['source']['kind'] = 'real'
        with self.assertRaisesRegex(ValueError, 'synthetic provenance'):
            require_synthetic(data)

    def test_missing_repeat_quality_does_not_become_a_complete_case(self):
        data, case = self.fixture(['a'])
        good, failed = self.row(), self.row(error='native:failed', recall=None)
        failed['repeat'] = 2
        group = summaries(score_rows(data, [case], [good, failed]), [case], [good, failed])['all']['root']
        self.assertEqual(group['trials'], 2)
        self.assertIsNone(group['metrics']['recall_at_5']['mean'])
        self.assertEqual(group['metrics']['recall_at_5']['complete_applicable_cases'], 0)

    def test_missing_planned_repeats_are_not_counted_complete(self):
        data, case = self.fixture(['a'])
        good = self.row()
        plan = [{**good, 'repeat': i} for i in (1, 2, 3)]
        group = summaries(score_rows(data, [case], [good]), [case], plan)['all']['root']
        self.assertEqual(group['planned_trials'], 3)
        self.assertIsNone(group['metrics']['recall_at_5']['mean'])
        self.assertEqual(group['metrics']['recall_at_5']['complete_applicable_cases'], 0)


if __name__ == '__main__':
    unittest.main()
