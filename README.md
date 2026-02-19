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

## 内容标准

### ✅ 收录原则 (写什么)

- **`knowledge/notes/`**: 新信息、想法、线索、疑问。允许不确定性，作为未来 Edge 的输入。
- **`knowledge/edges/`**: 会在未来多次影响判断取舍的稳定认知。
- **`knowledge/archive/`**: 已结算、被替代或不再适用的内容。

### ⛔️ 拒收原则 (不写什么)

- 只在当下有用、不可复用的总结。
- 无法进入判断链条的“聪明观点”。
- 没有时间维度、无法被验证的结论。

### ⚠️ 维护规则

1. **notes → edges** 不是搬运，是提炼。
2. edge 一旦形成，不回写历史；演化通过新增或替代体现。
3. 迁移到 archive 必须有明确原因。
4. 3天未处理的 notes 应定期归档或删除。

---

## 外部连接扩展 (extensions/)

`extensions/` 目录存放的是 **供外部系统或 AI Agent 连接并接入 Edges 系统** 的接口与插件。它们不是 Edges 系统本身的开发工具，而是对外的“连接器”：

- **`mcp-servers/`**: 标准化的 [MCP](https://modelcontextprotocol.io/) 协议服务器。允许外部 AI 客户端（如 Claude Desktop, Cursor, IDE 插件）直接调用 Edges 的能力（如自动化笔记入库）。
- **`skills/`**: 供外部 Agent 加载的技能定义，使其了解如何按 Edges 的规范进行思考和操作。
- **`subagents/`**: 预配置的子代理，作为外部系统与 Edges 数据流之间的中转站。
- **`tools/`**: 暴露给外部调用的独立工具。

### 接入初始化

外部 Agent 或协作者在首次接入时，可通过以下命令同步配置：

```bash
./bin/init-extensions
```

### 核心连接器: MCP Servers

当前已实现的 MCP 服务：

- **`new-note`**: 提供标准的 `new-note` tool。
  - 功能: 接收外部总结信息，并按规范自动写入 `knowledge/notes/`。


