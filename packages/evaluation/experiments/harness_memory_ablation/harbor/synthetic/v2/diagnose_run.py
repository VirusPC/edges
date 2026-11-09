"""Numeric-only development diagnostics; never tune or mutate a frozen run."""
from __future__ import annotations

import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import statistics
import sys

HARBOR = Path(__file__).resolve().parents[2]
if str(HARBOR) not in sys.path:
    sys.path.insert(0, str(HARBOR))
import report as reporting
from dataset import timestamp

QUALITY = ('recall_at_5', 'evidence_recall_at_5', 'selected_precision',
           'selected_set_exact', 'evidence_set_exact', 'extra_selected_count')


def require_synthetic(dataset):
    items = [dataset, *dataset.get('cases', []), *dataset.get('memories', [])]
    if not dataset.get('cases') or not dataset.get('memories') or any(
            item.get('source', {}).get('kind') != 'synthetic' for item in items):
        raise ValueError('Explicit synthetic provenance required at every level')


def score_rows(dataset, cases, rows):
    require_synthetic(dataset)
    case_map = {case['case_id']: case for case in cases}
    output = []
    for row in rows:
        case = case_map[row['case_id']]
        coverage = case['coverage']
        result = {'case_id': case['case_id'], 'condition': row['condition'],
                  'repeat': row['repeat'], 'family': case['scenario_family'],
                  'scope_start': coverage['scope_start'],
                  'coverage_role': coverage['coverage_role'],
                  'gold_count': len(case['gold_memory_ids']), 'failed': bool(row.get('error')),
                  **dict.fromkeys(QUALITY)}
        if not result['failed']:
            selected = set(row['selected_memory_ids'])
            gold = set(case['gold_memory_ids'])
            visible = {memory['memory_id'] for memory in dataset['memories']
                       if timestamp(memory['available_at']) < timestamp(case['query_at'])}
            if row['condition'] == 'none':
                visible = set()
            hits = selected & gold & visible
            observed = set(row.get('observed_memory_ids', []))
            exact = selected == gold and gold <= visible
            result.update(recall_at_5=len(hits) / len(gold) if gold else None,
                          evidence_recall_at_5=len(hits & observed) / len(gold) if gold else None,
                          selected_precision=len(hits) / len(selected) if selected else None,
                          selected_set_exact=float(exact),
                          evidence_set_exact=float(exact and gold <= observed),
                          extra_selected_count=len(selected - hits))
            for key, source in [('recall_at_5', 'selected_recall_at_5'),
                                ('evidence_recall_at_5', 'evidence_recall_at_5')]:
                if result[key] != row.get(source):
                    raise ValueError('Independent recall differs from frozen trial scores')
        output.append(result)
    return output


def summaries(rows, cases, plan):
    from collections import Counter
    planned = Counter((entry['case_id'], entry['condition']) for entry in plan)
    groups = {'all': cases}
    for field in ('family', 'scope_start', 'coverage_role'):
        def case_value(case):
            return case['scenario_family'] if field == 'family' else case['coverage'][field]
        for value in sorted({case_value(case) for case in cases}):
            groups[field + ':' + value] = [case for case in cases if case_value(case) == value]
    result = {}
    for key, group_cases in groups.items():
        ids = {case['case_id'] for case in group_cases}
        group = [row for row in rows if row['case_id'] in ids]
        arms = {}
        for arm in ('scoped', 'root', 'none'):
            selected = [row for row in group if row['condition'] == arm]
            metrics = {}
            for metric in QUALITY:
                by_case = defaultdict(list)
                for row in selected:
                    by_case[row['case_id']].append(row[metric])
                values = [statistics.mean(by_case[cid]) for cid in ids
                          if planned[cid, arm] and len(by_case[cid]) == planned[cid, arm]
                          and all(x is not None for x in by_case[cid])]
                metrics[metric] = {'mean': statistics.mean(values) if values else None,
                                   'complete_applicable_cases': len(values),
                                   'cases': len(ids)}
            arms[arm] = {'trials': len(selected), 'planned_trials': sum(planned[cid, arm] for cid in ids),
                         'failures': sum(row['failed'] for row in selected),
                         'metrics': metrics}
        result[key] = arms
    return result


def generate(run, output):
    run = run.resolve(strict=True)
    output = output.resolve()
    if output.is_relative_to(run):
        raise ValueError('Output must be outside the immutable run')
    manifest = reporting.read_json(run / 'manifest.json')
    dataset = reporting.read_json(run / 'dataset.json')
    require_synthetic(dataset)
    if manifest['dataset_sha256'] != reporting.sha256(run / 'dataset.json'):
        raise ValueError('Dataset hash mismatch')
    cases = reporting.selected_cases(dataset, manifest)
    rows = reporting.read_json(run / 'trials.json')
    plan = reporting.read_json(run / 'plan.json')
    reporting.validate_matrix(plan, rows, cases, manifest)
    scored = score_rows(dataset, cases, rows)
    observed_errors = {row['case_id'] for row in scored if row['condition'] in ('scoped', 'root')
                       and row['gold_count'] and not row['failed'] and row['recall_at_5'] < 1}
    observed_full = {row['case_id'] for row in scored if row['condition'] in ('scoped', 'root')
                     and row['gold_count'] and not row['failed'] and row['recall_at_5'] == 1}
    result = {'schema_version': 1, 'kind': ('synthetic_development_quality_diagnostic'
                                          if manifest['split'] == 'dev' else 'synthetic_quality_diagnostic'),
              'dataset_sha256': manifest['dataset_sha256'], 'split': manifest['split'],
              'planned_trials': len(plan), 'observed_trials': len(rows),
              'status': 'complete' if len(rows) == len(plan) else 'incomplete',
              'failed_trials': sum(row['failed'] for row in scored),
              'program_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'trials': scored, 'groups': summaries(scored, cases, plan),
              'diagnostic': {'positive_scenes_with_recall_error_in_either_memory_arm': len(observed_errors),
                             'positive_scenes_with_full_recall_in_either_memory_arm': len(observed_full),
                             'semantic_error_review_required': True,
                             'acceptance': 'Arithmetic flags only. Review errors before any claim; no required winning arm.'},
              'limitations': ['Development observations are not held-out effectiveness evidence.',
                              'Empty selections have undefined selected_precision; exact-set scoring covers abstention.',
                              'Failed quality is missing, not zero. Means average repeats within each case.',
                              'Exact evidence sets show returned-text exposure, not answer correctness.',
                              'Evidence exact match constrains the final selection; reading extra background is allowed.',
                              'The 2-scene error + some full-recall gate is an engineering diagnostic, not statistical power.']}
    output.mkdir(parents=True, exist_ok=False)
    (output / 'quality.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = generate(args.run, args.output)
    print(json.dumps({'trials': len(result['trials']), 'diagnostic': result['diagnostic']}))
