# 自然工作请求补充集 v2

本集补充“从自然工作请求找执行前记忆”的受控合成场景。它借鉴真实开发请求的抽象特征，问题和事实全部重新虚构；与 [v1](../README.md)及真实历史数据分别维护、分别报告。

**当前状态：开发诊断与冻结测试集评估均已完成，分别报告。** [36 次开发运行](RESULTS.md)确认 1 个漏检场景，未达到预声明的两场景门槛，并发现最小必要 gold 与提示允许相关背景之间的契约边界。在已知这些局限后，保持题目、提示和 gold 不变，追加执行 **36 test × 3 条件 × 3 次＝324 次，零失败**。结果与解释见[测试报告](TEST_RESULTS.md)及[验证记录](TEST_VALIDATION.md)；完成执行不等于已经证明覆盖充分或检索质量稳定可区分。

覆盖主张、真实来源画像的限制、工程配额与开发验收标准见 [COVERAGE.md](COVERAGE.md)。本集不以任何一组胜出作为有效标准，也不把源码或独立审阅通过等同模型检索有效。

[未满召回的 trace 分析](TRACE_ANALYSIS.md)逐一对照四次低分与同题成功重复，区分未继续发现、索引到正文未展开，以及已读但最终未选择；事后诊断不替换冻结分数。

数据入口：[完整题集与真值](data-v2.json)、[离线构造诊断](DATA_REPORT.md)、[生成摘要](BUILD_MANIFEST.json)、[独立审阅与修订过程](REVIEW.md)、[审阅收据摘要](review-summary.json)、[开发协议](protocol-dev-v2.json)、[首次 test 运行前冻结的测试协议](protocol-test-v2.json)。最终数据为 48 题、336 条虚构记忆，gold 数量为 0 条 × 8 题、2 条 × 3 题、3 条 × 36 题、4 条 × 1 题。

在 Harbor 目录运行生成程序：

```bash
python3 -B -m synthetic.v2.generate --seed 20261110 --output synthetic/v2
python3 -B -m unittest discover -s tests -p test_synthetic_v2.py -v
```

产物包含完整 `data-v2.json`、离线 `DATA_REPORT.md/json` 与 `BUILD_MANIFEST.json`；具体任务蓝图、场景事实和 gold 解析程序随源码保留。相同参数应逐字节复现，改变内容必须使用新的候选目录，不能覆盖已有冻结产物。源程序不读取真实问题或原始会话。

每题的工作请求、语料正文、适用条件与必要证据需要独立语义审阅；结构校验只证明格式和声明的一致性。词法基线是离线诊断，模型结果单独保存，不以词法差距预言 scoped/root 差异。

题集范围为 48 题（12 dev、36 test）。先完成 36 次开发模型诊断，再以独立协议完成 324 次 test；test 题目在原数据冻结前已经过语义质量审阅，未按开发分差改题。原开发协议、覆盖计划和开发结果保留当时状态，当前 test 状态以新测试报告为准；dev/test 不混合计分。

运行仍使用 [统一 Harbor 程序](../../README.md)，保持三臂内容与预算一致。原生日志、含宿主上下文的结果及私密来源画像集中在 `harbor/local/`；公开材料只包含虚构数据、聚合诊断与方法说明。

复现开发诊断时使用新的输出目录（以下第一条命令会调用模型）：

```bash
python run.py --dataset synthetic/v2/data-v2.json --output local/new-v2-dev \
  --model gpt-6.1-sol --reasoning-effort low --codex-version 0.162.1 \
  --agent-image edges-harbor-codex@sha256:9d716a68df44e82b2dc449d653e0e0321cc7becba7438f7c4184f0a22becccfd \
  --auth-json /authorized/auth.json --split dev --repeats 1 --seed 20261110 \
  --concurrency 12 --timeout 180 --bootstrap 2000
python report.py --run local/new-v2-dev --output local/new-v2-full-report
python synthetic_report.py --run local/new-v2-dev --output local/new-v2-public-report
python -m synthetic.v2.diagnose_run --run local/new-v2-dev --output local/new-v2-quality
```

实际选中数量为分母的 precision 与旧协议的固定分母 `precision_at_5` 分开命名；集合精确匹配可发现召回满分但多选的情况。诊断程序按题平均、对失败与缺失保持 N/A，输出 family、起点及来源启发/定向压力分层，不导出回答或宿主上下文。

复现本次 test 时，使用另一个新输出目录，将上述执行参数改为 `--split test --repeats 3`，其他参数保持测试协议一致。原始数值导出器的“负例误选率”命名在 v2 中只代表空必要 gold 题的非空选择；公开测试报告已加解释标签，未更改分数。额外相关背景不能直接判为语义误用。
