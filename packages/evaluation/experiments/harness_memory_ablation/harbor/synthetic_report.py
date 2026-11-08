"""Publish numeric-only results of explicitly synthetic trials, including scenario strata."""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path

import report as reporting

METRICS = ('selected_recall_at_5', 'evidence_recall_at_5', 'answer_checks_pass',
           'empty_gold_selection_rate', 'total_tokens', 'uncached_input_tokens',
           'agent_latency_ms', 'trial_wall_ms', 'tool_calls')


def family(case: dict) -> str:
    return case.get('scenario_family', case.get('synthetic', {}).get('family', 'unspecified'))


def number(value, scale=1, digits=2):
    return 'N/A' if value is None else f'{value * scale:,.{digits}f}'


def comparison_statement(summary: dict, metric: str) -> str:
    result = summary['paired_comparisons']['scoped-vs-root'][metric]
    interval = result.get('ci95')
    if summary['status'] != 'complete' or summary['failed_trials'] or result.get('paired_coverage') != 1:
        return '执行或覆盖有缺口，不能据此下完整矩阵结论'
    if not interval:
        return '缺少可解释区间'
    if interval[0] > 0:
        return 'scoped 较高（描述性区间不含零）'
    if interval[1] < 0:
        return 'scoped 较低（描述性区间不含零）'
    return '差异区间含零，未取得明确区分证据'


def generate(run_dir: Path, output: Path, bootstrap: int = 2000) -> dict:
    if bootstrap < 0:
        raise ValueError('Bootstrap count must be nonnegative')
    run_dir = run_dir.resolve(strict=True)
    output = output.resolve()
    if output.is_relative_to(run_dir):
        raise ValueError('Output must be outside the immutable run')
    manifest = reporting.read_json(run_dir / 'manifest.json')
    dataset = reporting.read_json(run_dir / 'dataset.json')
    if not dataset.get('cases') or any(c.get('source', {}).get('kind') != 'synthetic' for c in dataset['cases']):
        raise ValueError('Only explicitly synthetic datasets may use this public exporter')
    if manifest.get('dataset_sha256') != reporting.sha256(run_dir / 'dataset.json'):
        raise ValueError('Dataset hash mismatch')
    cases = reporting.selected_cases(dataset, manifest)
    plan = reporting.read_json(run_dir / 'plan.json')
    rows = reporting.read_json(run_dir / 'trials.json')
    reporting.validate_matrix(plan, rows, cases, manifest)
    protocol, _ = reporting.load_protocol(run_dir, manifest)
    if any(row.get('error') and any(row.get(k) is not None for k in protocol.QUALITY_METRICS) for row in rows):
        raise ValueError('Failed trial has non-null quality scores')
    groups = {'all': cases}
    for name in sorted({family(case) for case in cases}):
        groups[name] = [case for case in cases if family(case) == name]
    tracks = {}
    for name, chosen in groups.items():
        ids = {case['case_id'] for case in chosen}
        summary = protocol.summarize([p for p in plan if p['case_id'] in ids],
                                     [r for r in rows if r['case_id'] in ids], chosen,
                                     seed=manifest['seed'], bootstrap=bootstrap)
        summary['cases'] = len(chosen)
        summary['positive_cases'] = sum(bool(case['gold_memory_ids']) for case in chosen)
        tracks[name] = summary
    config_fields = ('model', 'codex_version', 'harbor_version', 'reasoning_effort',
                     'timeout_sec', 'prompt_version', 'dataset_sha256', 'seed', 'repeats',
                     'split', 'concurrency', 'execution_wall_ms', 'agent_image')
    result = {'schema_version': 1, 'data_kind': 'synthetic',
              'configuration': {key: manifest.get(key) for key in config_fields},
              'bootstrap_replicates': bootstrap, 'tracks': tracks,
              'interpretation': 'Synthetic controlled diagnostic; scenario clusters share templates. Descriptive intervals, no multiplicity correction; not real-world effectiveness proof.'}
    overall = tracks['all']
    lines = ['# 合成场景三组记忆消融结果', '',
             '**本报告只描述程序生成的受控场景，与真实历史问题实验分开。**', '',
             f"执行 {overall['observed_trials']}/{overall['planned_trials']} trials，失败 {overall['failed_trials']}；{len(cases)} 题，三条件各重复 {manifest['repeats']} 次，固定 {manifest['concurrency']} 路并发。", '',
             f"recall@5：{comparison_statement(overall, 'selected_recall_at_5')}。总 token：{comparison_statement(overall, 'total_tokens')}。Agent 时延：{comparison_statement(overall, 'agent_latency_ms')}。", '',
             '## 整体指标', '', '| 指标 | scoped | root | none | scoped−root / 描述性 95% CI |',
             '| --- | ---: | ---: | ---: | --- |']
    labels = {'selected_recall_at_5': 'recall@5 (%)', 'evidence_recall_at_5': '正文证据 recall@5 (%)',
              'answer_checks_pass': '局部答案检查 (%)', 'empty_gold_selection_rate': '负例误选率 (%)',
              'total_tokens': '累计总 token', 'uncached_input_tokens': '未缓存输入 token',
              'agent_latency_ms': 'Agent 时延 (秒)', 'trial_wall_ms': 'trial 墙钟 (秒)', 'tool_calls': '工具调用数'}
    for metric in METRICS:
        scale = 100 if metric.endswith('_at_5') or metric in ('answer_checks_pass', 'empty_gold_selection_rate') else .001 if metric.endswith('_ms') else 1
        values = [overall['by_condition'][arm]['metrics'][metric]['mean'] for arm in ('scoped', 'root', 'none')]
        paired = overall['paired_comparisons']['scoped-vs-root'][metric]
        ci = paired.get('ci95') or [None, None]
        lines.append('| ' + labels[metric] + ' | ' + ' | '.join(number(v, scale) for v in values) +
                     f" | {number(paired['delta_left_minus_right'], scale)} [{number(ci[0], scale)}, {number(ci[1], scale)}] |")
    lines += ['', '## 场景分层', '', '| 场景 | 题数 / 正例 | scoped recall | root recall | 差值 / 描述性 95% CI (pp) |',
              '| --- | ---: | ---: | ---: | --- |']
    for name, summary in tracks.items():
        if name == 'all':
            continue
        paired = summary['paired_comparisons']['scoped-vs-root']['selected_recall_at_5']
        ci = paired.get('ci95') or [None, None]
        lines.append(f"| {name} | {summary['cases']} / {summary['positive_cases']} | " +
                     number(paired['left_mean'], 100) + '% | ' + number(paired['right_mean'], 100) + '% | ' +
                     f"{number(paired['delta_left_minus_right'], 100)} [{number(ci[0], 100)}, {number(ci[1], 100)}] |")
    lines += ['', '## 口径与局限', '',
              '- 每题先平均重复，再按场景等权；以合成场景 session 聚类 bootstrap，区间为描述性且未校正多重比较。不同实体共享生成模板，不等于从真实任务总体独立随机抽样。',
              '- 正例 recall 上限按完整 gold 计算；无 gold 为 N/A，另报误选。none 的 recall 零是无实验记忆的结构基线。答案检查是预先声明的局部事实正则，不是语义完成率。',
              '- 两种有记忆条件使用相同正文和时间过滤，root 保留 scope 元数据。处理包含目录位置与发现索引；此实验不能分离这两者。',
              '- 词法基线与 oracle 的离线差距只能验证合成任务需要区分作用域，不能替代真实 Agent 三组差异。若两组均接近满分，应报告天花板，不能宣称检索质量优势。',
              '- 总 token 包含缓存输入；提供方缓存未隔离。并发时延包含共享资源竞争，不等于独立执行时延。JSON 保留完整覆盖率与原始 trial 分位数。',
              '- 使用冻结程序的统计函数重算；另需离线审计原生用量、评分、工具行为及输入完整性。本导出器不自动证明工具命令语义符合约束。',
              '- 未根据正式测试结果重选题目、修改 gold 或调参。生成器、数据报告和预先协议应与本报告一同审阅。', '',
              f"配置：{manifest['model']} / {manifest.get('reasoning_effort')}；Codex {manifest['codex_version']}；Harbor {manifest['harbor_version']}；Agent 时限 {manifest['timeout_sec']} 秒；seed {manifest['seed']}。", '',
              f"批次墙钟：{number(manifest.get('execution_wall_ms'), 1 / 60000)} 分钟。", '']
    safe_rows = []
    for row in rows:
        safe = {'case_id': row['case_id'], 'condition': row['condition'], 'repeat': row['repeat'], 'failed': bool(row.get('error'))}
        for key in METRICS:
            value = row.get(key)
            if value is not None and (type(value) not in (int, float) or not math.isfinite(value)):
                raise ValueError('Metric is not finite numeric data')
            safe[key] = value
        safe_rows.append(safe)
    output.mkdir(parents=True, exist_ok=False)
    (output / 'report.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    (output / 'report.md').write_text('\n'.join(lines))
    fields = ['case_id', 'condition', 'repeat', 'failed', *METRICS]
    with (output / 'trials.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(safe_rows)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--bootstrap', default=2000, type=int)
    args = parser.parse_args()
    result = generate(args.run, args.output, args.bootstrap)
    print(json.dumps({'trials': result['tracks']['all']['observed_trials'], 'failures': result['tracks']['all']['failed_trials']}))


if __name__ == '__main__':
    main()
