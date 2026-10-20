---
name: reference_agent_oriented_cli
description: 设计或评审给 agent 用的 CLI 时查：AXI vs raw CLI vs MCP、--help、非交互、stdout/stderr、退出码、结构化错误码，及 AXI/Scalekit/clig.dev/gh --json/checklist 来源。
metadata:
  edges-title: 面向 agent 的 CLI 怎么设计
  edges-type: reference
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-08T14:24:29+08:00"
---

面向 agent 的 CLI 不是「给人看的终端程序再加 `--json`」，也不是默认上 MCP。有效界面是 agent-optimized CLI：自描述 `--help`、全程非交互、stdout 只放可解析结果、stderr 放诊断、失败稳定非零退出、错误带可分支的结构化码。

**Why:** 同一模型、同一任务，只换界面，成本和可靠性差一截。AXI 425 次 GitHub 任务（2026-03-21，Claude Sonnet 4.6）：`gh-axi` 100% / $0.050 / 3 轮，raw `gh` 86%，GitHub MCP 82–87% 且均价约 3 倍。Scalekit 75 次：MCP 比 `gh` 贵 4–32× token（最简任务 1,365 vs 44,026）；MCP 7/25 失败是连 Copilot MCP 的 TCP 超时，不是协议错。Smithery 里**自动生成**的 CLI 输给 native MCP（83.3% vs 91.7%）——差的是设计，不是「凡 CLI 都赢」。Scalekit 后半篇也写明：开发者自动化自己的仓用 CLI；agent 代表别人的用户跨租户才需要 MCP 的 OAuth/审计。

**How to apply:** 给 agent 做命令时按下面五条验收，缺一条 agent 就要靠猜。单命令写入工具不必上 AXI 的 TOON、无参 live 数据、分页、session hook。

### 一张图

```
flags only, no TTY prompts
  → --help with examples + required inputs + how to get structured output
  → validation fail: JSON error on stdout, diagnostics on stderr, exit 2, no side effects
  → success: JSON on stdout, progress on stderr, exit 0
  → failure: same JSON envelope with errorCode, non-zero exit
```

三种界面：raw CLI（人读表/色，agent 抠字段）/ MCP（类型化，但 schema 税）/ AXI 类 agent-optimized CLI（仍是 shell，输出按 token 预算重做）。AXI 的论点是原则不是协议：[axi.md](https://axi.md/)、[kunchenguid/axi](https://github.com/kunchenguid/axi)、[AXI skill](https://github.com/kunchenguid/axi/blob/main/.agents/skills/axi/SKILL.md)。

### 五条机制与来源

1. **自描述 `--help`，带例子。** [clig.dev](https://clig.dev/) 例子放最前；AXI 原则 10 每子命令精简完整参考；[agentnative P3](https://github.com/brettdavies/agentnative-cli)；[awesome-cli-for-ai-agents](https://github.com/deadbeef101010/awesome-cli-for-ai-agents)；[brigleb checklist](https://gist.githubusercontent.com/brigleb/08c20ebf8d83b398e10c35d4f2b98824/raw/c8fb69924dbe1f426d587e68efb70f3e87453689/cli-agent-checklist.md)。
2. **非交互。** clig.dev：永远不要把 prompt 当唯一输入，`--no-input` 时缺参就失败。AXI 原则 6：未知 flag 大声失败（exit 2），禁止默默丢掉。agentnative P1：stdin 接 `/dev/null` 也能跑完。[gh skill](https://github.com/cli/cli/blob/trunk/skills/gh/SKILL.md) 在非 TTY 下直接报错要 `--title`/`--body`，不打开编辑器。
3. **stdout = 机器结果，stderr = 诊断。** clig.dev 基础规则；AXI 通道划分；brigleb：JSON 走 stdout，进度走 stderr，`--json` 时退出码配 stdout 上的错误对象。[`gh --json`](https://cli.github.com/manual/gh_help_formatting) 是业界样板；[oclif](https://oclif.github.io/docs/json)；[agcli](https://github.com/matthiasdebernardini/agcli) 永远 JSON 但仍保留 `--json` 布尔位，以免吞掉后面的 positional。失败时**结构化错误仍在 stdout**（与成功同一信封）。
4. **稳定非零退出。** clig.dev：成功 0，失败非零并映射到失败模式。AXI：0 成功（含幂等 no-op），1 错误，2 用法。brigleb：2 bad args，4 auth，避开 126–255。[cli-agent-spec ExitCode](https://github.com/romamo/cli-agent-spec/blob/master/schemas/exit-code.json)。
5. **结构化错误码。** AXI：错误与正常输出同一结构，含可执行建议，先校验再调依赖。brigleb 配 `errorCode`。 [cli-builder](https://github.com/assetcorp/agent-skills/blob/main/skills/cli-builder/SKILL.md) 用 `status` + `error` 信封。

### 数字（引用，不代替读原文）

- AXI GitHub 研究：https://github.com/kunchenguid/axi/blob/main/bench-github/published-results/STUDY.md （425 runs）。`list_labels` 上 AXI 5/5、raw CLI 0/5，因为缺 `totalCount`。MCP 平均输入 137K–176K token vs CLI/AXI 约 46K。
- Scalekit：https://www.scalekit.com/blog/mcp-vs-cli-use 与 https://github.com/scalekit-inc/mcp-vs-cli-benchmark 。CLI 25/25；MCP 18/25。作者限定：测的是「开发者自动化自己的工作流」。
- Smithery：https://smithery.ai/blog

### 和 MCP

有 shell、工具少、调用方就是开发者 → agent-optimized CLI。无 shell 或要 OAuth/多租户审计 → MCP 仍有位置。不要把「删 MCP」当成调研结论。
