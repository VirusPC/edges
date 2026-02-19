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

## Agent Extensions 初始化

协作者在首次 clone 后，执行下面命令把 `extensions/skills/` 同步到各类 agent 的 skills 目录：

```bash
./bin/init-extensions
```

## MCP Servers

仓库支持多个 MCP server，统一放在 `extensions/mcp-servers/` 下。当前可用服务：

- `extensions/mcp-servers/new-note`：接收外部 AI 总结并执行入库（落盘、commit、push）

常用命令：

```bash
cd extensions/mcp-servers/new-note
npm install
npm run build
npm test
npm start
```
