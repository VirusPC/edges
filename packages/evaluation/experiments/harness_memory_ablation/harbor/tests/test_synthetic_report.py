import json
import unittest

import test_report as fixture_module
import synthetic_report


class SyntheticReportTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixture_module.ReportTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.fixture.manifest.update(concurrency=12, execution_wall_ms=60000)

    def test_private_or_mixed_input_is_rejected_before_output(self):
        self.fixture.save()
        with self.assertRaisesRegex(ValueError, 'explicitly synthetic'):
            synthetic_report.generate(self.fixture.run, self.fixture.output, bootstrap=20)
        self.assertFalse(self.fixture.output.exists())

    def test_family_stats_preserve_missing_values_without_exporting_answers(self):
        self.fixture.dataset['source'] = {'kind': 'synthetic'}
        for memory in self.fixture.memories:
            memory['source']['kind'] = 'synthetic'
        for i, case in enumerate(self.fixture.cases):
            case['source']['kind'] = 'synthetic'
            case['scenario_family'] = 'positive' if i < 2 else 'negative'
        self.fixture.save()
        result = synthetic_report.generate(self.fixture.run, self.fixture.output, bootstrap=20)
        self.assertEqual(result['tracks']['positive']['positive_cases'], 2)
        self.assertIsNone(result['tracks']['negative']['by_condition']['root']['metrics']['selected_recall_at_5']['mean'])
        self.assertEqual(result['tracks']['all']['paired_comparisons']['scoped-vs-root']['selected_recall_at_5']['delta_left_minus_right'], .25)
        for path in self.fixture.output.iterdir():
            text = path.read_text()
            for value in ('PRIVATE_QUESTION', 'PRIVATE_BODY', 'PRIVATE_SESSION', 'PRIVATE_TRACE', 'PRIVATE_ANSWER', 'PRIVATE_RAW', 'PRIVATE_PROMPT_HASH'):
                self.assertNotIn(value, text)

    def test_real_memories_with_synthetic_queries_are_not_pure_synthetic(self):
        self.fixture.dataset['source'] = {'kind': 'synthetic'}
        for case in self.fixture.cases:
            case['source']['kind'] = 'synthetic'
        self.fixture.save()
        with self.assertRaisesRegex(ValueError, 'explicitly synthetic'):
            synthetic_report.generate(self.fixture.run, self.fixture.output)
        self.assertFalse(self.fixture.output.exists())


if __name__ == '__main__':
    unittest.main()
