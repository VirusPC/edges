# Edges - 认知系统

> 构建可复用的认知优势，提高未来判断效率

## 项目背景

Edges 是一个 **以知识沉淀为手段、以长期认知复利为目标的个人系统**。

它关注的不是一次判断是否正确，
而是：**是否在时间维度上，持续形成可复用的判断优势（edges）。**

## 设计思想

**终端捕获，核心沉淀**：各个终端（ChatGPT、Cursor、Claude Code、Gemini CLI 等）作为知识的感知端，负责总结对话中的核心逻辑与灵感。通过 **`new-note` MCP Server**，这些零散的思考被自动、标准地沉淀到 Edges 系统的 `knowledge/notes/` 中，实现“对话即笔记，思考即资产”的自动化闭环。

### 核心指标

所有内容沉淀都应服务于以下指标，否则价值极低：

- **效率**: 同类判断是否更快形成
- **时间**: 相似问题是否更容易处理
- **评估**: 判断是否可被复盘或证伪
- **落地**: 是否真实影响行动与取舍
- **复利**: 是否能在未来多次被调用并放大收益

---

## 1. 核心资产 (knowledge/)

这是系统的核心数据层，承载所有的认知材料。

### 目录流转

```
knowledge/notes → 加工 → knowledge/edges → 归档/删除
      ↓                        ↓
   原材料暂存                形成可复用判断
  允许不确定性               提高未来决策效率
```

### 收录标准

| 目录             | 存什么 (Yes)     | 作用                            |
| -------------- | ------------- | ----------------------------- |
| **`notes/`**   | 新信息、想法、线索、疑问  | **输入**: 允许不确定性，作为未来 Edge 的原材料 |
| **`edges/`**   | 稳定的、可复用的判断优势  | **资产**: 提高成功概率，减少错误成本         |
| **`archive/`** | 已结算、失效或被替代的内容 | **历史**: 保留痕迹，不干扰当前决策          |

以下两个目录**不参与上述流转**，是支撑性存储：

| 目录               | 存什么              | 作用                              |
| ---------------- | ---------------- | ------------------------------- |
| **`projects/`**  | 成体系的专题材料与产出 | **专题**: 围绕单一议题的长期材料 |
| **`resources/`** | 图片、音频等附件         | **附件**: 被笔记引用的媒体文件，不独立阅读        |

### ⛔️ 拒收原则 (Not)

- 只在当下有用、不可复用的总结
- 无法进入判断链条的“聪明观点”
- 没有时间维度、无法被验证的结论

### ⚠️ 维护规则

1. **notes → edges** 不是搬运，是提炼。
2. edge 一旦形成，不回写历史；演化通过新增或替代体现。
3. 迁移到 archive 必须有明确原因。

---

## 2. 用户命令 (bin/)

存放面向用户/Agent 反复调用的可执行命令，由 `pnpm setup` 加入 `$PATH` 后可在任意目录直接调用。

- **`new-note`**: 快速创建笔记的 CLI 工具。

> 项目自身的维护脚本（setup、release、migration 等）不在 `bin/`，见下一节 `scripts/`。
> skill 分发不在 `bin/`，见下方「接入初始化」。

---

## 3. 项目维护脚本 (scripts/)

存放本仓库开发者用于初始化、构建、清理、发布等**一次性或低频**操作的脚本。不会自动加入 `$PATH`，统一通过 `pnpm <script-name>` 入口调用。

- **`setup`**: 首次接入时初始化本地环境（注册 `bin/` 到 PATH、加载 `.env`）。对应 `pnpm setup`。

判据：换台机器克隆下来要重新跑一遍的 → `scripts/`；装好之后用户/Agent 天天用的 → `bin/`。

---

## 4. 外部连接 (extensions/)

`extensions/` 目录是 Edges 系统对外的**接口层**，供外部 Agent 或系统接入。

**收录标准**: 判据是「换一个 Agent、换一台机器，这东西还带得走吗」，而不是「它是代码还是文档」。纯 markdown 同样属于 extensions。

- **`mcp-servers/`**: 标准化接口服务 (如 `new-note` server)，让 AI 能够直接操作知识库。
- **`skills/`**: 导出给外部 Agent 的思维链与操作规范。
- **`subagents/`**: 专用子代理配置。
- **`tools/`**: 独立调用工具。
- **`system-prompt/`**: 可复用的 system prompt 片段与模板，接新 Agent 时直接取用。
- **`new-server/`**: 新机器/新服务的开荒操作手册（用户与权限、DNS、第三方模型 key 接入等）。
- **`docs/`**: 接口协议与接入指南。
- **`others/`**: 尚未归类的可复用片段（如存档的检索式）。

### 接入初始化

外部 Agent 或协作者在首次接入时，执行：

```bash
# (推荐) 初始化本地开发环境并添加 bin/ 路径到系统 PATH
pnpm setup

# 把 skills 写入 ~/.agents/skills；Claude Code 不读中枢，另建软链
pnpm skills:install
```

只想用 skill、不接入整套系统的话，不必克隆本仓库：

```bash
npx skills@latest add VirusPC/edges/extensions/skills
```

子路径不能省，原因见 [`extensions/skills/README.md`](extensions/skills/README.md)。

---

## 5. 工作区管理 (Workspace)

本项目采用 **pnpm workspace** 进行“服务端服务工作区”管理，实现环境隔离与统一调度。

### 核心操作

- **安装依赖**: `pnpm install` (在根目录执行)
- **启动 MCP Server**:
  - 启动 New Note: `pnpm start:note-server`
  - 开发模式: `pnpm dev:note-server`
- **通用的启动器**: `pnpm mcp:run <server-name> <command>`
  - 示例: `pnpm mcp:run new-note build`

### 结构规范

- `extensions/mcp-servers/*`: 独立的 MCP 服务单元，各自拥有 `package.json`，是 workspace 的唯一成员。
- `bin/`: 面向用户/Agent 反复调用的可执行命令（shell，非 node 包），由 `pnpm setup` 加入 `$PATH`。
- `scripts/`: 项目自身的维护脚本（setup、release、migration 等），通过 `pnpm <name>` 调用，不入 PATH。
- `tsconfig.base.json`: 共享的全局编译器配置。

---

许可证为 [MIT](LICENSE)。仓库级版本记录见 [CHANGELOG.md](CHANGELOG.md)。Skill 各自发版，见 `extensions/skills/<name>/CHANGELOG.md`。