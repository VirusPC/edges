# OpenSpec 在 Codex 下未写入 ~/.codex/prompts 的原因总结

> Ingested on 2026-02-20

# OpenSpec 在 Codex 下未写入 ~/.codex/prompts 的原因总结

## 现象
在使用 OpenSpec 初始化 Codex 集成时，理论上应在 `~/.codex/prompts/` 目录下生成对应的提示词文件，但实际运行后未看到该目录或文件生成。

## 核心原因

### 1. Codex 机制演进
Codex CLI 的提示词加载机制正在从“自定义 prompts 目录”逐步迁移到基于 skills 或模块化能力注册的方式。因此旧版本依赖的 `~/.codex/prompts/` 机制可能已被弱化或废弃。

### 2. OpenSpec 版本差异
不同版本的 OpenSpec 在初始化阶段的行为不同。有些版本不会强制写入本地 prompts 文件，而是通过 AGENTS.md 或内部模板机制驱动 AI 行为。

### 3. 条件触发写入
OpenSpec 可能会根据检测到的 Codex 版本或能力决定是否生成 prompts 文件。如果检测到当前环境不支持该机制，则会回退到其他集成方式，而不会报错。

## 结论
未写入 `~/.codex/prompts/` 并不一定代表初始化失败，而很可能是由于 Codex 与 OpenSpec 的集成方式发生变化。当前趋势是通过 skills 或 AGENTS.md 约定进行上下文控制，而非静态 prompts 文件。

---

该现象属于生态演进带来的行为变化，而非单纯的错误。
