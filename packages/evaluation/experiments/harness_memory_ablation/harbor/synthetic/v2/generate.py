"""Generate natural fictional retrieval scenes without external data or models."""
from __future__ import annotations

import argparse
from collections import Counter
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
import random
import re
import sys

HARBOR = Path(__file__).resolve().parents[2]
if str(HARBOR) not in sys.path:
    sys.path.insert(0, str(HARBOR))
from dataset import validate_dataset as validate_provenance
from run import validate_dataset as validate_runner
from synthetic.v2.oracle import expected_memory_ids, instant, reference_answer, resolve
from synthetic.v2.scenes_actions import SCENES as ACTIONS

VERSION = 'natural-scenarios-v2'
DEFAULT_SEED = 20261110
QUERY_AT = '2025-06-18T09:00:00Z'
FAMILIES = ('implicit_workflow', 'boundary_routing', 'historical_decision',
            'conditional_override', 'multihop_plan', 'negative_near_miss')
MATRIX = {s: {f: n for f in FAMILIES} for s, n in [('dev', 2), ('test', 6)]}
SOURCE_FILES = ('__init__.py', 'generate.py', 'oracle.py', 'scenes_actions.py', 'scenes_reasoning.py')


def encoded(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + '\n').encode()


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def opaque(seed: int, kind: str, value: str) -> str:
    return sha(f'{VERSION}|{seed}|{kind}|{value}'.encode())[:24]


def scope_start(split: str, position: int) -> str:
    repos = {1, 4, 8} if split == 'dev' else {1, 4, 7, 10, 13, 16, 19, 22}
    deep = {10} if split == 'dev' else {5, 14, 23, 31}
    return 'deep' if position in deep else 'repository' if position in repos else 'root'


def render_rule(rule: dict) -> str:
    # Body facts, applicability and version are the same in every runner condition.
    paragraphs = [f"{rule['entity']}：{rule['context']}", rule['decision'], rule['why'], rule['boundary']]
    def date(value):
        parsed = instant(value)
        return f"{parsed.year}年{parsed.month}月{parsed.day}日"
    period = f"{date(rule['available_at'])}记。所述安排从{date(rule['effective_from'])}起适用"
    if rule['effective_until']:
        period += f"，到{date(rule['effective_until'])}停止使用"
    paragraphs.append(period + '。')
    return '\n\n'.join(paragraphs) + '\n'


def build_dataset(seed: int = DEFAULT_SEED, *, _scenes: list[dict] | None = None) -> dict:
    if type(seed) is not int:
        raise ValueError('seed must be integer')
    if _scenes is None:
        from synthetic.v2.scenes_reasoning import SCENES as REASONING
        scenes = deepcopy(ACTIONS + REASONING)
    else:
        scenes = deepcopy(_scenes)
    scenes.sort(key=lambda s: (0 if s['split'] == 'dev' else 1, FAMILIES.index(s['family']), s['blueprint']))
    truth = {'schema_version': 1, 'rules': [], 'cases': [],
             'semantics': 'Operation obligations plus recursive evidence dependencies; exact authored conditions, strict availability, active intervals, priority then effective date. No question matching.',
             'limitation': 'An authored consistency oracle does not establish independent natural-language gold validity.'}
    positions = Counter()
    for scene in scenes:
        split = scene['split']
        position_key = (split, scene['family'])
        position = FAMILIES.index(scene['family']) * MATRIX[split][scene['family']] + positions[position_key]
        start = scope_start(split, position)
        positions[position_key] += 1
        scene_id = 'scene-' + opaque(seed, 'scene', scene['blueprint'])
        repo = 'workspaces/' + opaque(seed, 'workspace', scene['blueprint'])[:10]
        scope = '.' if start == 'root' else repo if start == 'repository' else repo + '/workbench'
        cid = 'case-' + opaque(seed, 'case', scene['blueprint'])
        specs = scene['rules']
        negative = scene.get('negative', False)
        keys = {r['key'] for r in specs}
        dependencies = {key for r in specs for key in r.get('requires', [])}
        if not dependencies <= keys:
            raise ValueError('unknown authored evidence dependency')
        obligations = sorted(keys - dependencies)
        ct = dict(case_id=cid, scene_id=scene_id, entity=scene['entity'], blueprint=scene['blueprint'],
                  scope=scope, scope_start=start, query_at=QUERY_AT, split=split, question=scene['question'],
                  task_mode=scene['task_mode'], scenario_family=scene['family'], operation=scene['operation'],
                  facts=scene['facts'], obligations=obligations, negative=negative,
                  request_form=scene['request_form'], conflict_kind=scene['conflict_kind'])
        truth['cases'].append(ct)
        current = []
        for index, spec in enumerate(specs):
            key = f"{scene['blueprint']}:{spec['key']}:current"
            owner = ['.', repo, repo + '/workbench'][index % 3]
            context = scene.get('context') or f"这份记录来自{scene['entity']}的一次工作复盘。团队把当时确认的做法写下来，供后来接手同类事务的人核对对象、阶段和已知限制；没有记录的条件仍需确认，不用惯例填补未知事实。"
            if negative:
                context = f"团队为“{spec['title']}”留下这份工作记录。交接时需要把相关对象、处理步骤和未解决事项一起说明，避免后来接手的人只看到结论，却找不到当时作出安排的依据。"
            rule = dict(rule_id='rule-' + opaque(seed, 'rule', key), memory_id='m-' + opaque(seed, 'memory', key),
                        scene_id=scene_id, entity=scene['entity'], unit=spec['key'], operation=scene['operation'] if not negative else scene['operation'] + ':other-activity',
                        scope=owner, context=context, title=spec['title'], decision=spec['decision'], why=spec['why'],
                        boundary=spec['boundary'], requires=spec.get('requires', []), when=dict(scene['facts']),
                        available_at='2025-03-03T08:00:00Z', effective_from='2025-03-05T00:00:00Z', effective_until=None,
                        priority=10, activity_label=spec['title'], condition_text=scene.get('condition_text', '适用对象和前提以上文的具体说明为准，不扩展到其他活动。'),
                        status_note='这是现行安排；仅适用于上面写明的对象与事项。', variant='current', split=split)
            current.append(rule)
        rules = list(current)
        # All scenes contain seven memories; variation in gold is preserved, never top-k truncated.
        variants = ['other_condition', 'expired', 'future_effective', 'unrelated', 'future_unavailable']
        for index in range(7 - len(current)):
            kind = variants[index % len(variants)]
            base = current[index % len(current)]
            rule = deepcopy(base)
            key = f"{scene['blueprint']}:{base['unit']}:{kind}"
            rule.update(rule_id='rule-' + opaque(seed, 'rule', key), memory_id='m-' + opaque(seed, 'memory', key),
                        variant=kind, priority=30 + index, requires=[])
            if kind == 'other_condition':
                rule['when']['phase'] = 'facilitated_training'
                rule['activity_label'] = '现场带教演练'
                rule['condition_text'] = '仅在有人现场带教、使用虚构样例的演练中适用。'
                rule['title'] = base['title'] + '：带教演练另记'
                rule['decision'] = f"{scene['entity']}的带教演练使用专门准备的虚构材料，由带教人现场讲解和纠错。演练材料不进入实际业务记录，也不交给真实受众；练习结束后清理临时副本，留下讲评摘要即可。"
                rule['why'] = '带教需要让新人安全地试错，因此使用可重置的样例，并由现场人员确认练习进度。这个安排不能替代真实工作的确认步骤，真实资料也不能为了省事直接放进练习环境。'
                rule['boundary'] = '只有明确组织的带教演练才采用本页办法。一般草稿、内部准备和正式任务并不自动等于演练；没有带教安排时，仍查实际工作的现行记录，不以本页简化流程。'
                rule['status_note'] = '演练分支长期有效，与实际业务分支并存；条件不同，不是全面替代。'
            elif kind == 'expired':
                rule['title'] = base['title'] + '：早期试办留档'
                rule['activity_label'] = '试办期间的临时行政交接'
                rule['condition_text'] = '仅说明早期试办当时的安排，不规定当前任务的处理方式。'
                rule['available_at'] = '2025-01-09T08:00:00Z'
                rule['effective_from'] = '2025-01-10T00:00:00Z'
                rule['effective_until'] = '2025-02-20T00:00:00Z'
                rule['decision'] = f"{scene['entity']}早期试办时，先由临时协调人把事项记入个人手册，月底再合并到共享记录。那时参与者很少，协调人同时负责核对和转交，没有另外设置固定交接入口。"
                rule['why'] = '这只是人员尚未固定时的临时安排，并非经过长期验证的正式制度。参与人数增多后，个人手册无法保证接手者及时看到变化，因此试办结束后没有继续沿用。'
                rule['boundary'] = '本页仅用于保存早期试办过程，适用期结束后不能据此安排新的工作。当前如何处理应另查现行记录；这里没有完整描述后续方案，也不能据此推断新的职责已经分配。'
                rule['status_note'] = '已结束的临时办法，留档不等于仍然适用。'
                rule['operation'] += ':early-administration'
            elif kind == 'future_effective':
                rule['title'] = base['title'] + '：秋季草案'
                rule['activity_label'] = '秋季接收窗口的筹备'
                rule['condition_text'] = '目前只供讨论，新的接收流程尚不能用于实际工作。'
                rule['effective_from'] = '2025-09-01T00:00:00Z'
                rule['decision'] = f"{scene['entity']}为秋季拟定统一接收窗口：相关材料先交到轮值台登记，再由轮值人安排复核。草案希望减少多头转交，但目前轮值名单与接收窗口尚未投入使用。"
                rule['why'] = '拟议方案针对秋季扩大协作后的情况，需要先确认人员和入口。将来可能采用的做法不能倒过来解释当前已经执行的安排，也不能只因为记录较新就提前生效。'
                rule['boundary'] = '本页已经可以查阅，但秋季之前仅供筹备讨论；当前任务继续使用现行办法。若到计划日期仍未具备启用条件，应重新确认，不能把预计日期当成已经完成的切换记录。'
                rule['status_note'] = '可见但尚未生效；不得提前替代现行流程。'
            elif kind == 'unrelated':
                rule['title'] = '活动物料借还的一次复盘'
                rule['activity_label'] = '活动桌椅等实体物料的借还'
                rule['condition_text'] = '只在实际发生这批物料的领用与归还时适用。'
                rule['operation'] += ':supplies'
                rule['decision'] = f"{scene['entity']}借用活动桌椅时，要由领用人和归还人核对清单，损坏物件单独记录。没有检查完不能只把钥匙放回柜中就认为交接完成；缺失项交给物料负责人跟进。"
                rule['why'] = '这次复盘源于一次实体物料交接，两边都以为对方已经清点，直到下一次活动才发现缺件。留下清单是为了让物件状态可追溯，不是为团队所有文字材料增加一道签收。'
                rule['boundary'] = '适用对象限于活动桌椅和同批领用的实体物料，不覆盖服务配置、文案拟写或记录整理。只写备选方案时没有实际领用，不需要凭空创建交接人或归还日期。'
                rule['status_note'] = '现行物料办法；属于另一项工作。'
            else:
                rule['title'] = base['title'] + '：年末补充'
                rule['available_at'] = '2025-11-02T08:00:00Z'
                rule['effective_from'] = '2025-11-03T00:00:00Z'
                rule['status_note'] = '年末才留下的补充，本次查询时间无法见到。'
            rules.append(rule)
        truth['rules'].extend(rules)
    memories = [dict(memory_id=r['memory_id'], scope=r['scope'], title=f"{r['entity']} · {r['title']}", body=render_rule(r),
                     available_at=r['available_at'], source=dict(kind='synthetic', generator=VERSION, rule_id=r['rule_id'], scene_id=r['scene_id'], split=r['split'])) for r in truth['rules']]
    memories.sort(key=lambda m: m['memory_id'])
    cases = []
    rules_by_id = {r['rule_id']: r for r in truth['rules']}
    for ct in truth['cases']:
        resolved = resolve(truth, ct)
        gold = expected_memory_ids(truth, ct)
        own_exclusions = [{'memory_id': rules_by_id[rid]['memory_id'], 'reason': reason,
                           'detail': rules_by_id[rid]['status_note']} for rid, reason in sorted(resolved['exclusions'].items()) if rules_by_id[rid]['scene_id'] == ct['scene_id']]
        case = {k: ct[k] for k in ('case_id', 'scope', 'query_at', 'split', 'question', 'task_mode', 'scenario_family')}
        role = 'targeted_stress' if ct['scope_start'] == 'deep' else 'source_informed'
        case.update(gold_memory_ids=gold, source=dict(kind='synthetic', scene_id=ct['scene_id'],
                    session_id='session-' + opaque(seed, 'session', ct['scene_id']), trace_id='trace-' + opaque(seed, 'trace', ct['scene_id']),
                    observation_id='observation-' + opaque(seed, 'observation', ct['scene_id'])),
                    scope_evidence=dict(kind='synthetic-scene', detail='Authored current workspace, independent of gold location; root means workspace-wide start.'),
                    coverage_role=role, coverage=dict(scope_start=ct['scope_start'], coverage_role=role,
                        request_form=ct['request_form'], intent_visibility={'implicit_workflow': 'implicit_constraints', 'boundary_routing': 'implicit_boundaries', 'historical_decision': 'explicit_explanation_request', 'conditional_override': 'contextual_conditions', 'multihop_plan': 'alias_and_dependency', 'negative_near_miss': 'no_applicable_record'}[ct['scenario_family']],
                        scope_certainty='explicit_scene_start', evidence_count=len(gold), conflict_kind=ct['conflict_kind'],
                        lexical_overlap='entity_exact_task_paraphrase', empirical_basis='anonymous_aggregate_profile_only',
                        blueprint=ct['blueprint']), reference_answer=reference_answer(truth, ct),
                    relevance_rationale=[dict(memory_id=rules_by_id[rid]['memory_id'], reason=f"必要证据义务 {rules_by_id[rid]['unit']} 或其依赖；对象、操作、条件和有效期匹配。", decision=rules_by_id[rid]['decision']) for rid in resolved['rule_ids']],
                    non_gold_exclusion=own_exclusions)
        cases.append(case)
    data = dict(schema_version=1, source=dict(kind='synthetic', generator=VERSION, seed=seed,
                provenance='Wholly fictional authored scenarios; no historical examples, private data, model or external corpus read.'),
                memories=memories, cases=cases, scene_truth=truth)
    if _scenes is None:
        validate_synthetic(data)
    return data


def validate_synthetic(data: dict) -> dict:
    validate_provenance(data)
    validate_runner(data)
    if data.get('source', {}).get('kind') != 'synthetic':
        raise ValueError('synthetic source required')
    truth = data['scene_truth']
    rules = {r['rule_id']: r for r in truth['rules']}
    scenes = {c['case_id']: c for c in truth['cases']}
    if len(rules) != len(truth['rules']) or len(scenes) != len(truth['cases']):
        raise ValueError('duplicate truth identities')
    mapping = {}
    for m in data['memories']:
        if m['source'].get('kind') != 'synthetic':
            raise ValueError('non-synthetic memory')
        rid = m['source']['rule_id']
        r = rules[rid]
        if rid in mapping or m['memory_id'] != r['memory_id']:
            raise ValueError('memory identity mismatch')
        mapping[rid] = m['memory_id']
        if m['scope'] != r['scope'] or m['available_at'] != r['available_at'] or m['body'] != render_rule(r) or m['title'] != f"{r['entity']} · {r['title']}":
            raise ValueError('memory differs from authored truth')
        cjk = len(re.findall(r'[\u4e00-\u9fff]', m['body']))
        if not 200 <= cjk <= 700 or not 3 <= len(m['body'].strip().split('\n\n')) <= 6:
            raise ValueError(f'memory length/paragraphs outside range: {m["memory_id"]}: {cjk}')
    if set(mapping) != set(rules) or set(scenes) != {c['case_id'] for c in data['cases']}:
        raise ValueError('incomplete truth mapping')
    entities, blueprints = {'dev': set(), 'test': set()}, {'dev': set(), 'test': set()}
    for case in data['cases']:
        ct = scenes[case['case_id']]
        if case['source'].get('kind') != 'synthetic' or case['source']['scene_id'] != ct['scene_id']:
            raise ValueError('case source mismatch')
        for key in ('question', 'scope', 'query_at', 'split', 'task_mode', 'scenario_family'):
            if case[key] != ct[key]:
                raise ValueError('case differs from authored scene')
        expected = expected_memory_ids(truth, ct)
        resolution = resolve(truth, ct)
        if not ct['negative'] and resolution['unresolved_obligations']:
            raise ValueError('positive scene has unresolved evidence dependencies')
        if case['gold_memory_ids'] != expected:
            raise ValueError('gold differs from dependency resolution')
        if ct['negative'] != (len(expected) == 0) or (not ct['negative'] and not 2 <= len(expected) <= 5):
            raise ValueError('authored positive/negative or evidence budget mismatch; never truncate gold')
        if case['reference_answer'] != reference_answer(truth, ct):
            raise ValueError('reference answer mismatch')
        if any(m in case['question'] for m in mapping.values()) or re.search(r'(?:m-|rule-|scene-)[0-9a-f]{20}', case['question']):
            raise ValueError('question leaks machine identities')
        if case['coverage']['evidence_count'] != len(expected) or case['coverage']['scope_start'] != ct['scope_start'] or case['coverage']['coverage_role'] != case['coverage_role']:
            raise ValueError('coverage differs from authored scene')
        if {r['memory_id'] for r in case['relevance_rationale']} != set(expected):
            raise ValueError('rationale does not cover exactly the resolved gold')
        if ct['scope_start'] == 'deep' and case['coverage_role'] != 'targeted_stress':
            raise ValueError('deep scope must be marked directed stress')
        entities[ct['split']].add(ct['entity'])
        blueprints[ct['split']].add(ct['blueprint'])
        if len([r for r in truth['rules'] if r['scene_id'] == ct['scene_id']]) != 7:
            raise ValueError('scene must have seven memories')
    if entities['dev'] & entities['test'] or blueprints['dev'] & blueprints['test']:
        raise ValueError('split entity or concrete blueprint overlap')
    actual = {s: dict(Counter(c['scenario_family'] for c in data['cases'] if c['split'] == s)) for s in MATRIX}
    if actual != MATRIX:
        raise ValueError('family matrix mismatch')
    starts = {s: dict(Counter(c['coverage']['scope_start'] for c in data['cases'] if c['split'] == s)) for s in MATRIX}
    if starts != {'dev': {'root': 8, 'repository': 3, 'deep': 1}, 'test': {'root': 24, 'repository': 8, 'deep': 4}}:
        raise ValueError('scope matrix mismatch')
    return dict(family_matrix=actual, scope_matrix=starts, entity_overlap=0, blueprint_overlap=0,
                all_gold_computed=True, no_gold_truncation=True)


def tokens(value: str) -> Counter:
    out = []
    for part in re.findall(r'[a-z0-9]+|[\u4e00-\u9fff]+', value.lower()):
        out.extend(part[i:i + 2] for i in range(len(part) - 1)) if re.fullmatch(r'[\u4e00-\u9fff]+', part) else out.append(part)
    return Counter(out)


def diagnose(data: dict) -> dict:
    validation = validate_synthetic(data)
    rows = []
    for case in data['cases']:
        visible = [m for m in data['memories'] if instant(m['available_at']) < instant(case['query_at'])]
        docs = {m['memory_id']: tokens((m['title'] + '\n' + m['body']).replace(m['scope'], '') if m['scope'] != '.' else m['title'] + '\n' + m['body']) for m in visible}
        df = Counter(t for doc in docs.values() for t in doc)
        n, avg = len(docs), sum(sum(d.values()) for d in docs.values()) / len(docs)
        query = tokens(case['question'])
        def score(mid):
            doc = docs[mid]
            return sum(math.log(1 + (n - df[t] + .5) / (df[t] + .5)) * doc[t] * 2.2 /
                       (doc[t] + 1.2 * (.25 + .75 * sum(doc.values()) / avg)) for t in query if doc[t])
        chosen = sorted(docs, key=lambda mid: (-score(mid), mid))[:5]
        gold = set(case['gold_memory_ids'])
        rows.append(dict(case_id=case['case_id'], split=case['split'], family=case['scenario_family'],
                         visible_memories=n, gold_count=len(gold), theoretical_recall_ceiling=min(5, len(gold)) / len(gold) if gold else None,
                         bm25_top5=chosen, bm25_recall=len(gold.intersection(chosen)) / len(gold) if gold else None))
    lengths = [len(re.findall(r'[\u4e00-\u9fff]', m['body'])) for m in data['memories']]
    return dict(kind='offline_construct_diagnostics_not_agent_results', dataset_sha256=sha(encoded(data)),
                validation=validation, counts=dict(cases=len(data['cases']), memories=len(data['memories']),
                    gold_counts=dict(sorted(Counter(len(c['gold_memory_ids']) for c in data['cases']).items())),
                    body_cjk_min=min(lengths), body_cjk_max=max(lengths)), cases=rows,
                limitations=['Purposeful fictional engineering coverage, not a representative sample.',
                    'Eight distinct blueprints per family remain authored from one design distribution; version/training/administration distractor scaffolds are shared across scenes.',
                    'No >5-gold cases: coverage gap relative to the anonymous historical profile.',
                    'Balanced family quotas are engineering coverage, not estimates of real request frequency; creative near-miss negatives do not cover all ordinary-knowledge negatives.',
                    'Root/repository starts reflect aggregate inspiration; five deep cases are directed stress.',
                    'BM25 is a deterministic lexical diagnostic, not a prediction of agent or index benefit.',
                    'Oracle consistency is separate from independent natural-language gold review.',
                    'All splits share the global memory library as retrieval distractors; query entities, sessions and concrete blueprints are disjoint.',
                    'Retrieval and explanatory answers do not measure successful execution of the original task.'])


def artifact_bytes(data: dict) -> dict[str, bytes]:
    report = diagnose(data)
    md = '# 自然合成补充 v2：离线构造诊断\n\n' + f"固定生成 {len(data['cases'])} 题、{len(data['memories'])} 条虚构记忆；没有调用模型。\n\n"
    md += '| split | cases | root | repository | deep |\n| --- | ---: | ---: | ---: | ---: |\n'
    for split in MATRIX:
        scopes = report['validation']['scope_matrix'][split]
        md += f"| {split} | {sum(MATRIX[split].values())} | {scopes['root']} | {scopes['repository']} | {scopes['deep']} |\n"
    md += '\nGold 数量分布：' + str(report['counts']['gold_counts']) + '。正文中文字符范围：' + str(report['counts']['body_cjk_min']) + '–' + str(report['counts']['body_cjk_max']) + '。\n\n'
    md += '\n'.join('- ' + line for line in report['limitations']) + '\n'
    artifacts = {'data-v2.json': encoded(data), 'DATA_REPORT.json': encoded(report), 'DATA_REPORT.md': md.encode()}
    source_hashes = {name: sha(Path(__file__).with_name(name).read_bytes()) for name in SOURCE_FILES}
    source_hashes.update({'harbor/' + name: sha((HARBOR / name).read_bytes()) for name in ('dataset.py', 'run.py')})
    manifest = dict(schema_version=1, generator=VERSION, seed=data['source']['seed'],
                    source_sha256=source_hashes, artifacts_sha256={name: sha(body) for name, body in artifacts.items()},
                    command='python -m synthetic.v2.generate --seed <seed> --output <directory>',
                    input_policy='Only bundled fictional blueprint constants; source files are read solely to hash the build. No external corpus, network or model.')
    manifest['build_sha256'] = sha(encoded(manifest))
    artifacts['BUILD_MANIFEST.json'] = encoded(manifest)
    return artifacts


def write_artifacts(data: dict, output: Path) -> dict:
    artifacts = artifact_bytes(data)
    for name, body in artifacts.items():
        destination = output / name
        if destination.is_symlink() or (destination.exists() and destination.read_bytes() != body):
            raise ValueError(f'refusing to overwrite different artifact: {name}')
    output.mkdir(parents=True, exist_ok=True)
    for name, body in artifacts.items():
        destination = output / name
        if not destination.exists():
            with destination.open('xb') as handle:
                handle.write(body)
    return {name: sha(body) for name, body in artifacts.items()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=DEFAULT_SEED)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(write_artifacts(build_dataset(args.seed), args.output), sort_keys=True))


if __name__ == '__main__':
    main()
