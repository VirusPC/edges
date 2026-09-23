---
name: project_minigtr_host_bootstrap_layered
description: 改 minigtr 初始化、想封整机 skill、或分不清 notes/ADR/NAS skill 边界时打开：装机留 notes，底座约定进本条，Langfuse 走 ADR 0014–0020，绿联 NAS 走 linux-nas-direct-link；不要做整机大包 skill。
metadata:
  edges-title: minigtr 整机配置分层沉淀，不做大一统 skill
  edges-type: project
  edges-origin-session-id: bc-7416e474-38c0-5a69-bdad-c8989f0ca214
  edges-agent-client: grok-bot
  edges-username: minigtr设备助手
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-23T06:48:10+00:00"
---

minigtr（机械师 Mini GTR 的 Ubuntu 侧）的「整机配置与初始化」不做成一条大一统 shared skill；按层沉淀：装机故事留 notes，主机约束与底座约定进 project memory，本机服务走已有 ADR，外设拓扑走专项 skill。

**Why:**
整机过程混了一次性高风险操作（双系统分区 / EFI）、可重复底座步骤（SSH、Tailscale、Docker）、已有决策痕迹的服务（Langfuse ADR），以及另一条拓扑（绿联 NAS）。塞进一个 skill 会不可复用、难脱敏，也容易让助手在装机步骤上越权自动跑。用户明确要求先落到 project memory，而不是再封大 skill。

**How to apply:**
- 双系统安装、固件键、分区与首次桌面：只读 / 续写 `knowledge/notes/` 里同日长笔记与 `docs/superpowers/plans/` 安装计划；不自动改分区或 EFI。
- 主机底座约定（用户 `viruspc`、主机名 `minigtr`、开源 amdgpu 勿装 NVIDIA、免密 sudo、SSH、Tailscale、Chrome、Docker、企业 Wi‑Fi 用 PEAP+MSCHAPv2、中文输入 ibus-libpinyin）：以本条与后续同主题 project 条目为准；具体命令按当时机器状态执行，口令与 `100.x` 不进公开仓。
- 自托管 Langfuse：遵守 `docs/adr/0014`–`0020`（官方 compose、密钥留本机磁盘、访问面等）；不要把部署步骤抄进「整机 skill」。
- 绿联 NAS 直连 / SMB / NAS 上 Tailscale：跑 `shared-extensions/skills/linux-nas-direct-link`（中文）；细节对照同日 NAS 复盘笔记。
- 有人再说「初始化 minigtr / 整机配置做成 skill」：先指向本条分层；只有某一层已经重复执行、且边界清晰时，再为那一层单独沉淀 skill（kebab-case，中文正文），不要复活整机大包。
