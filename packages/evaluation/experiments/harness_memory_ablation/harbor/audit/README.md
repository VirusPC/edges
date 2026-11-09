# 离线审计与资源采样

这里维护可重复执行的完整性检查，不调用模型，不执行被审阅的 shell 命令。`check.py` 本身也不访问 Docker 或网络。它沿用首次实验的 preflight / result 审计方法，按输入文件推导 case、条件、重复数和统计参数，不内置实际问题、gold 映射或某次运行的数量。

## 核对已准备或已完成的运行

Python 3.11+，从本目录或任何 cwd 直接调用脚本。输出目录必须尚不存在且位于 run 和 input-root 外；输出 JSON/命令清单为私密材料，文件权限 0600。例子中的路径均为占位符。

```bash
python /path/to/harbor/audit/check.py \
  --run /path/to/local/run --stage prepared \
  --trusted-source /path/to/trusted/harbor \
  --output /path/to/local/preflight-audit

python /path/to/harbor/audit/check.py \
  --run /path/to/local/run \
  --report /path/to/local/report/report.json \
  --protocol /path/to/local/protocol.json \
  --protocol-sha256 "$EXPECTED_PROTOCOL_SHA256" \
  --dataset-input dataset.json --input-root /path/to/local/inputs \
  --trusted-source /path/to/trusted/harbor \
  --resources /path/to/local/resources.jsonl \
  --output /path/to/local/completed-audit
```

退出码 0 表示所选范围的一致性检查通过，1 表示失败。结果在 `audit.json`；`commands-for-review.jsonl` 只导出原生 `item.completed.command_execution.command` 和定位信息，所有记录仍为 `not_reviewed`。脚本不会把 shell 关键词、工具种类或零错误数等同于“行为合规”。不要直接公开这两个输出文件。

`--protocol`、`--report`、`--resources` 都可省略；省略表示没有核对对应材料，不能称为完整审计。`--stage prepared` 不要求模型执行产物。completed 要求完整计划矩阵且有结束标记，失败 trial 保留失败与已测成本，不用零填质量字段；缺少原生证据会明确失败或标记未完成用量对账。

归档 Python 是可执行代码。`--trusted-source` 将全部归档 runtime `.py` 与独立可信的源码目录逐文件核对后，才加载其中的 runner、metrics、dataset、report；不向输入目录写 `__pycache__`。确已审阅并信任归档时可改用 `--trust-archived-code`，它不提供代码沙箱。不要对来源不明的归档使用这个选项。自报哈希只能验证一致性，不能证明真实性；独立保存协议摘要、源码 revision 和原始材料仍然必要。

协议 JSON 使用已有冻结格式：`inputs` 为相对输入路径到 SHA-256 的映射；`--dataset-input` 指出其中与 run/dataset.json 对应的键。提供 `--input-root` 时检查映射内所有文件，禁止路径逃逸。`--protocol-sha256` 是外部信任锚，不从同一协议中推导；若省略，只记录协议摘要。协议中存在的模型、版本、超时、seed、repeat、并发等参数须与 manifest 一致；completed 的 bootstrap 次数取自归档 result，并与 `statistical_plan.bootstrap_samples` 对齐。

核对范围：

- 数据 schema、时间条件、来源 session 划分；case × 三条件 × repeat 笛卡尔计划及唯一 trial 身份。
- manifest 中的数据/源码摘要，协议输入摘要；用冻结 runner 重建每题 workspace，比较全部正文、索引与文件清单，核对同题提示、CWD、独立 verifier、构建上下文和源文件。重建是冻结实现的一致性检验，不是对该实现正确性的独立证明。
- 从原生日志重算 verifier/逐 trial 质量字段；独立对账 Codex turn、rollout 累计、逐 response 求和、trajectory、Harbor agent_result 五路 token，并重算 Agent 阶段时延。失败 trial 可能缺少完整 rollout；审计不会将其称为成功的五路对账。
- 独立只在已完成工具的返回内容中重建 marker、唯一正文片段的 observed ID 集合，命令字符串及最终答案不计正文证据。
- 用冻结 metrics 重算完整汇总；若提供原始 `report.py` 产生的私密 report.json，还核对全部五个分层的数据卡、三个配对比较、来源 session 数和覆盖率。**公开脱敏聚合 JSON 不是此参数的输入格式。**
- 可选资源 JSONL：完整有效采样帧的容器内存合计及观测峰值、缺失帧、与原生阶段交叉核对的并发峰值、开头漏采时长；若旧日志带 `coverage_assessment`，核对支持的同名字段。

## 保存可复用的资源采样

`monitor_resources.py` 是唯一会访问 Docker 的入口，只使用读取命令：`info`、`ps`、`stats --no-stream`、限定 `.State` 的 `inspect`。它不启动、停止或调整容器，不读取 Config/Env、Agent 问题、答案或命令正文。可在 run 创建前启动，按该 run 下的原生 trial 名筛选 Compose project。

```bash
python /path/to/harbor/audit/monitor_resources.py \
  --run /path/to/local/new-run \
  --output /path/to/local/resources.jsonl --interval 5
```

每帧立即 flush，记录已知数量、完整/失败状态、Docker 报告的内存工作集、CPU、PID 数和可见容器的 OOM 状态。计划全部完成且连续三帧无活跃实验容器后停止；Ctrl-C 保留此前帧并记录中断。`--max-samples` 可用于限制采样次数。Docker 不可用或 stats 竞态失败不会被当作零占用；退出与删除之间可见的容器也检查 OOM 状态。

Docker stats 内存值不是精确进程 RSS，因此 `memory_rss_bytes` 保留 null；也不包含完整 Docker VM、daemon 与 build 开销。100% CPU 约为一个核。OOM 字段是采样时 `.State.OOMKilled`，不是完整事件流：已经移除的容器和采样间隙可能漏掉 OOM；同一 OOM 状态可能跨帧重复，不能把帧计数称为独立 OOM 事件数。启动缺口、失败帧和离散采样使观测峰值只是下界。

## 保留在 local/support 或原件归档中的材料

首次实验的具体标注裁决脚本含题目 ID → gold、排重和规范化决策，属于该次数据构造原件，不能变成通用规则；封板审阅、逐题依据与具体命令人工复核表同样留在授权本地归档。迁移、发布脱敏脚本不属于运行协议。

首次工具审计脚本包含 shell 初筛和人工裁决合并；这里仅保留通用的事件/命令导出，避免把有限语法识别器包装为安全证明。已有人工审计记录应与原始日志共同保留。用户来源、问题是否自包含、gold 是否充分、语言规范化是否夹带答案、读取辅助 skill 是否影响答案，仍需独立语义复核。脚本也不能替代网络抓包、文件系统差异、费用核算或质量收益论证。

离线测试：

```bash
python -B -m unittest discover -s /path/to/harbor/tests -p test_audit.py -v
```

测试用合成归档覆盖数据/源码/协议篡改、计划漏项与重复、额外文件进入镜像上下文、符号链接、原生 token 改动、报告配对统计改动，以及缺失资源帧与不实峰值。模型服务和 Docker 均不参与这些测试。
