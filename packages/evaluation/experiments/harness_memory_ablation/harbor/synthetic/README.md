# 合成场景记忆消融

这是公开、确定性生成的构念诊断数据，用于检验目录放置是否改变检索命中、误选、token 与时延。所有组织、业务、问题、约定和来源 ID 均为虚构；没有读取或复用真实用户问题、私密记忆或其编码来源。它不替代真实场景证据，也不预设 scoped 应胜过 root。

材料入口：[完整题集与场景真值](data-v1.json)、[数据报告](DATA_REPORT.md)、[机器可读诊断](DATA_REPORT.json)、[构建摘要](BUILD_MANIFEST.json)、[冻结模型实验协议](protocol-v1.json)、[独立审阅方法与证据](REVIEW.md)、[dev 执行验证](reports/dev-v1/report.md)。

在 Harbor 程序目录运行：

```bash
python3 -B -m synthetic.generate \
  --seed 20261109 --distractor-scopes 48 --output synthetic
python3 -B -m unittest discover -s tests -p 'test_synthetic.py' -v

# 独立解析自然语言题目和正文，不调用生成器 oracle
python3 -B synthetic/review.py --dataset synthetic/data-v1.json \
  --protocol synthetic/protocol-v1.json --runner run.py \
  --output local/synthetic-review.json
```

相同程序与参数产生逐字节相同的四份产物：`data-v1.json`、`DATA_REPORT.json`、`DATA_REPORT.md`、`BUILD_MANIFEST.json`。生成时间和绝对路径不进入产物。重复运行是无写入的幂等检查；已有任一产物内容变化时拒绝覆盖，且在写入前检查全部目标。新的 seed、干扰数量或程序版本应使用新目录/版本，不覆盖冻结实验。

## 冻结构造矩阵

| family | dev | test | 需要辨别的关系 |
| --- | ---: | ---: | --- |
| local | 3 | 12 | 多业务同名规则；当前服务的发布门槛与留存版本 |
| override | 1 | 6 | 子层覆盖父层两项规则，第三项从父层继承 |
| cross_scope | 2 | 6 | 当前业务一项规则，加协作业务的两项规则 |
| global | 1 | 4 | 根层有明确受众的行政规则，不是当前服务的业务流水规则 |
| negative | 1 | 4 | 自包含算术问题；可见语料存在，但没有适用记忆 |

共 40 题，每题独立场景；dev/test 按业务实体、session 和 trace 隔离。**模板和解析规则共享**，因此不能把这种划分说成未见过的任务模板泛化。默认 48 个额外干扰域，加 40 个主要实体与 8 个协作实体，共 96 个虚构业务域。所有域有两层业务目录、重复主题和版本；根层另有行政规则。共有 193 个记忆 scope、682 条记忆，查询时可见 586 条，96 条未来记忆按原 runner 的时间过滤不可见。test 30 题处于非根 scope，另 2 题为根 scope。每题 gold 0–3 条，没有为了 @5 截断必要证据。

## 场景事实到问题与 gold

`generate.py` 先构造 `scene_truth.entities/rules/cases`，场景明确当前维护对象、请求的业务/主题、历史时点、规则 owner 与适用受众。自然语言问题由场景需求生成，不由已有 gold 反写。实体名来自本文件程序内的虚构词表；seed 只控制实体排列、opaque ID 与规则值。

`oracle.py` 不读取问题、memory 正文或存储的 gold。它为每个请求从结构事实重新求解：

1. 必须 `available_at < query_at`；版本区间为 `effective_from <= query_at < effective_until`。
2. owner 必须是目标实体的祖先或自身；根层规则还须满足明确受众。受众限制不能扩大目录适用范围。
3. 同主题优先选更深的有效规则；同层优先选生效起点更晚的版本。同优先级未解冲突直接拒绝，不随意挑一个。
4. 跨域请求分别求解，再合并所有必要规则；最后把 rule ID 映射到 opaque memory ID。

正文逐条写明同样的适用、覆盖和时间语义。过期版本、被子层覆盖的父规则、兄弟业务、未请求主题与未来记录都有结构化排除理由。每题的 `relevance_rationale` 列出每个必要 gold 的理由，`non_gold_exclusion` 给排除类别计数与示例；完整排除映射可用 `oracle.exclusion_reasons` 重算。`reference_answer` 从 scene truth 计算，用于独立审阅，不采用易误判释义的答案正则；模型实验的答案规则指标为 N/A，范围是检索与成本。

## 三臂与诊断边界

scoped 和 root 由同一个 runner 渲染相同正文，保留完整 scope/title/time 元数据，查询时拥有同一可见候选集。root 没有被剥夺适用目录；none 没有实验记忆。问题不含 memory ID、文件名或目录提示；当前任务 scope 仍由共同实验指令明确提供。memory ID 使用 seed 的命名空间摘要，不编码场景、主题、目录或 gold 顺序。记忆按 opaque ID 排列。

离线诊断同时报告结构 oracle 与一个 scope-blind 词法 top-5：汉字双字片段和字母数字 token 的 BM25 风格打分，去除显式目录字符串，保留业务名与正文时间，文档频率也只用当时可见语料。它不理解覆盖规则、不做弃答，尤其负例固定选 5 条，因此不是 LLM，也不是分层优越性的证明。

判读区分度时，先检查 oracle 可解、可见 gold、非 gold 干扰、版本与目录冲突，再按 family 报告 oracle 与词法的差距。local 可以词法即全中，代表命中率中性但存在导航成本机会；跨域可能让分层导航退化；根层与负例提供控制。**不设一个要求 scoped 获胜的门槛，也不根据 test 的词法或模型成绩换 seed、删题或改难度。** 数据规模与诊断结果如实保留。

冻结前须由另一审阅者检查场景、问题、正文与 oracle 的一致性；程序验证不替代独审。先用 8 个 dev 场景检查协议、运行与评分可用性，再固定参数跑 32 个 test 场景。dev 可修实现错误，但不能按 test 模型效果挑数据；若冻结后发现语义缺陷，应保留旧版并另发版本及变更说明。正式模型结果由外部 runner/report 另行生成，`DATA_REPORT.*` 始终只代表离线数据诊断。

## 复用执行链路

生成器与 oracle 是数据构造程序；`review.py` 是独立的 v1 模板解析验证器，其适用边界见 [REVIEW.md](REVIEW.md)。修改模板时须同步审阅验证逻辑，不能因为旧解析器通过就宣布新语义正确。

安装依赖和构建基础镜像见[实验总入口](../README.md)。下列命令会调用真实模型；输出目录必须是新的，凭据仅从授权本地文件注入。固定 seed 控制数据、派发顺序和统计抽样，不保证模型输出逐字节重复。

```bash
python run.py --dataset synthetic/data-v1.json --output local/new-synthetic-test \
  --model gpt-6.1-sol --codex-version 0.162.1 \
  --agent-image edges-harbor-codex:0.162.1 --auth-json /authorized/auth.json \
  --split test --repeats 3 --seed 20261109 --concurrency 12
python report.py --run local/new-synthetic-test --output local/new-synthetic-report
python synthetic_report.py --run local/new-synthetic-test --output local/new-public-report
```

正式复现应按 `protocol-v1.json` 使用冻结镜像 digest，并记录实际运行源码；更换输入、模型、资源或并发须另立运行记录。上面的 12 路是本轮经过开发验收的设置，不是所有机器都适合的永久默认。离线审计和并行资源采样见 [audit/](../audit/README.md)。

新 seed、干扰数量或生成逻辑使用新目录，例如 `--output local/synthetic-v2`；独立审阅后为新数据记录新的协议和摘要，不能沿用本版协议的输入 hash。原始模型输出保存在实验 `local/`，公开结果导出器仅接受 dataset、memory、case 三层均明确为 synthetic 的数据，且不导出回答、命令、宿主路径或运行时私密上下文。
