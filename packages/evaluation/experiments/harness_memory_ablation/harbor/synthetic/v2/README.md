# 自然工作请求补充集 v2

本集补充“从自然工作请求找执行前记忆”的受控合成场景。它借鉴真实开发请求的抽象特征，问题和事实全部重新虚构；与 [v1](../README.md)及真实历史数据分别维护、分别报告。

**当前状态：开发诊断材料。** [36 次开发运行结果](RESULTS.md)确认 1 个漏检场景，未达到预声明的两场景门槛；运行后还发现最小必要 gold 与提示允许相关背景之间的契约边界。36 道 test 未执行；不能将本版称作已证明覆盖充分或检索效果稳定可区分的正式 benchmark。

覆盖主张、真实来源画像的限制、工程配额与开发验收标准见 [COVERAGE.md](COVERAGE.md)。本集不以任何一组胜出作为有效标准，也不把源码或独立审阅通过等同模型检索有效。

数据入口：[完整题集与真值](data-v2.json)、[离线构造诊断](DATA_REPORT.md)、[生成摘要](BUILD_MANIFEST.json)、[独立审阅与修订过程](REVIEW.md)、[审阅收据摘要](review-summary.json)、[模型调用前冻结的开发协议](protocol-dev-v2.json)。最终数据为 48 题、336 条虚构记忆，gold 数量为 0 条 × 8 题、2 条 × 3 题、3 条 × 36 题、4 条 × 1 题。

在 Harbor 目录运行生成程序：

```bash
python3 -B -m synthetic.v2.generate --seed 20261110 --output synthetic/v2
python3 -B -m unittest discover -s tests -p test_synthetic_v2.py -v
```

产物包含完整 `data-v2.json`、离线 `DATA_REPORT.md/json` 与 `BUILD_MANIFEST.json`；具体任务蓝图、场景事实和 gold 解析程序随源码保留。相同参数应逐字节复现，改变内容必须使用新的候选目录，不能覆盖已有冻结产物。源程序不读取真实问题或原始会话。

每题的工作请求、语料正文、适用条件与必要证据需要独立语义审阅；结构校验只证明格式和声明的一致性。词法基线是离线诊断，模型结果单独保存，不以词法差距预言 scoped/root 差异。

本轮范围为 48 题（12 dev、36 test），已执行全部 36 次开发模型诊断。Test 在冻结前做了语义质量审阅，冻结后保持未执行；不得将 dev 分数写成正式效应或未见测试的效果。

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
