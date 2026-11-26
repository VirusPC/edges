---
status: accepted
---

# 框架随包技能收成三个入口，发现与沉淀覆盖固定六类材料

2026-11-26 用户确认第一轮 grill。框架对外只留 `edges`、`edges-onboarding`、`edges-langfuse-agent-tracing`；提问或动手前按固定六类材料做相关发现；沉淀沿用各类既有创建与审批规则。本 ADR 部分取代 ADR 0051 中「ask / remember 等必须保持独立技能」的条款。初始化、旧技能名兼容与存量 AGENTS 迁移已由 [ADR 0055](0055-layered-init-hard-cut-and-reach.md) 补全。

**Status:** accepted（尚未实现）

**Amended by** [ADR 0055](0055-layered-init-hard-cut-and-reach.md)。

**Supersedes in part:** [ADR 0051](0051-bundled-skills-single-entry.md)

## Decision

1. **三个公开入口。** 随包技能只保留：
   - `edges-onboarding`：首次接入，以及后续重装与迁移。
   - `edges-langfuse-agent-tracing`：接通或修复可观测性；各平台适配按需读取。
   - `edges`：日常使用，覆盖记忆、笔记、任务、项目、技能、例程，并包含原独立技能 `edges-memory-ask`、`edges-memory-remember`、`edges-memory-add-type`、`edges-create-notes`、`edges-create-tasks`、`edges-tasks-classify` 的职责。

   用户或项目自建的业务技能保持独立，不并入 `edges`。CLI 与 MCP 能力不因技能入口减少而删除。`edges` 的 `SKILL.md` 仍是路由与共用约定，模块细节放在 `references/`，不把全部正文塞进一个文件。

2. **官方材料类型是固定六类。** 发现与沉淀所覆盖的官方材料类型为：记忆（Memory）、笔记（Notes）、任务（Tasks）、项目（Projects）、技能（Skills）、例程（Routines）。不以「入口里登记了什么就发现什么」作为开放清单。这与「记忆」这一类内部仍可扩展 Memory Type 是不同的轴，不取消既有的可扩展 Memory Type。Compose 与 Artifacts 不是这六类中的材料，不因本决策进入发现清单。

3. **提问或动手前先做相关发现。** 每次提问或动手前，按当前任务相关性在这六类中检索；不是把六类全文读一遍。本轮已查过且输入未变时可以复用。纯寒暄，以及用户指定按原文改字，可以不做发现。

4. **沉淀不统一扩大授权。** 识别到可沉淀的候选，不等于可以自动落盘。各材料沿用自身的创建与审批规则：已授权的沉淀按原规则执行；用户明确要求记住时进入对应流程；会改变执行效果的任务、例程，以及发布或发送，不因总入口合并而获得更宽的自动授权。缺信息时先问。不要把不同类型全部套进 memory remember。

5. **AGENTS 硬约束必须写清检索与沉淀的时机，不能只依赖 skill 说明。** 根硬约束不再只写 Memory 的 ask / remember，也不再点名即将取消的独立技能。必须在 `AGENTS.md` 硬约束里写明：提问或动手前通过 `edges` 按当前作用域检索相关的记忆、笔记、任务、项目、技能和例程；需要沉淀时按材料性质写入对应类型，并遵守该类型既有规则。这些时机与义务以系统入口硬约束为准；`edges` skill 的 description 只用于发现该技能，不能当作唯一触发依据。具体模板字句在实现时写入种子，不在本 ADR 冻结措辞。

## Considered Options

- **把业务技能也并进 `edges`：** 否决。业务技能（如周报、grill）有独立触发与版本节奏，与框架日常入口不是同一发现问题。
- **以组成登记为开放发现依据（登记即纳入未来类型）：** 否决。用户认为给使用方太多类型选择是负担；官方材料保持固定六类，避免发现面随自定义类型扩散。
- **只在动手改代码前检索，提问时不检索；或完全按需、不设默认触发：** 否决。硬约束要在提问和动手前都做相关发现，否则约定会漏执行。
- **由总入口统一自动落盘：** 否决。合并入口不扩大授权；任务人审、例程定义不授权平台配置等既有规则继续有效。
- **继续保留 ask / remember 为独立技能，以便 AGENTS 点名：** 否决。当初独立是为了防止技能太多时被挤掉；现在改为少入口，点名 `edges` 内的发现与沉淀流程即可，不必为点名而保留独立技能。
- **只把检索与沉淀时机写在 `edges` skill 的 description 里，AGENTS 只点名技能：** 否决。说明容易被挤掉，模型不一定会加载该技能；硬约束每次都会加载，必须在那里写清何时检索、何时沉淀。

## Consequences

- ADR 0051 第 3 条中「必须单独触发 / 非常规整理与归类」所保留的独立技能，除 `edges-onboarding` 与 `edges-langfuse-agent-tracing` 外，均并入 `edges`。0051 关于「默认一个总入口、记忆共享资源整棵搬家、已删目录硬切断」的决定仍然有效。
- 0051 曾否决「连 ask / remember 也并进 edges」；本 ADR 基于入口收敛后的新权衡，推翻这一条。
- 尚未实现。初始化、旧名兼容与存量迁移见 ADR 0055。
- 使用方内容仓与 bot 的 UpdateSkill 不在本次文档提交里。
