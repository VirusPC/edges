# Edges - 认知系统

> 构建可复用的认知优势，提高未来判断效率

---

## 目录结构

```
edges/
├── README.md           # 本文件 - 系统说明
├── knowledge/          # 🧠 知识库
│   ├── notes/          # 📝 原始想法、待处理内容
│   │   ├── inbox.md    # 快速收集箱（定期清理）
│   │   ├── to-learn.md # 待学习内容
│   │   └── ...
│   ├── edges/          # 🎯 已沉淀的认知优势
│   │   ├── README.md   # edges 总览
│   │   └── ...
│   └── archive/        # 📦 归档内容
│       └── ...
├── bin/                # 🛠️ 脚本工具
└── extensions/         # 🧩 Agent 扩展与 MCP Servers
```

---

## 命名规范

| 规则 | 示例 |
|------|------|
| 文件用小写+连字符 | `golang-concurrency.md` |
| 日期前缀用于时序内容 | `2025-01-15-meeting-notes.md` |
| edges 用领域/主题前缀 | `tech-database-indexing.md` |

---

## 内容流转

```
knowledge/notes → 加工 → knowledge/edges → 归档/删除
      ↓                        ↓
  3天未处理                形成可复用判断
  就删掉或归档               提高未来决策效率
```

---

## 核心原则

1. **notes → edges** 不是搬运，是提炼
2. 定期清理 inbox，不积累未处理内容
3. edges 要能回答「下次遇到类似情况，我会怎么做」

---

*最后更新: 2026-02-19*

---

## Agent Extensions (extensions/)

`extensions/` 目录存放了增强 AI Agent 能力的各类插件、服务和工具：

- **`mcp-servers/`**: [Model Context Protocol](https://modelcontextprotocol.io/) 服务器。允许 AI 直接通过标准化协议调用本地服务（如 `new-note` 服务用于自动化笔记入库）。
- **`skills/`**: 存放 AI Agent 的具体技能定义（如特定任务的 Prompt 模板或操作流程）。
- **`subagents/`**: 专门化的子代理配置，用于处理特定领域的复杂任务。
- **`tools/`**: 供 Agent 调用的独立脚本或工具集。

### 初始化

协作者在首次 clone 后，执行下面命令把 `extensions/skills/` 同步到各类 agent 的配置目录：

```bash
./bin/init-extensions
```

### 可用 MCP Servers

当前已实现的 MCP 服务：

- **`new-note`**: 接收外部 AI 总结并执行入库（落盘、commit、push）。
  - 路径: `extensions/mcp-servers/new-note`
  - 功能: 自动在 `knowledge/notes/` 下创建新文件并推送到仓库。


