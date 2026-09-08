# Edges - 认知系统

> 构建可复用的认知优势，提高未来判断效率

## 项目背景

Edges 是一个 **以知识沉淀为手段、以长期认知复利为目标的个人系统**。

它关注的不是一次判断是否正确，
而是：**是否在时间维度上，持续形成可复用的判断优势（edges）。**

## 设计思想

**终端捕获，核心沉淀**：各个终端（ChatGPT、Cursor、Claude Code、Gemini CLI 等）作为知识的感知端，负责总结对话中的核心逻辑与灵感。通过 **`edges-note` CLI**（本地有 shell 的 agent）或 **`new-note` MCP Server**（没有 shell 的宿主），这些零散的思考被自动、标准地沉淀到 Edges 系统的 `knowledge/notes/` 中，实现“对话即笔记，思考即资产”的自动化闭环。

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

以下目录**不参与上述流转**，是支撑性存储：

| 目录               | 存什么              | 作用                              |
| ---------------- | ---------------- | ------------------------------- |
| **`projects/`**  | 成体系的专题材料与产出 | **专题**: 围绕单一议题的长期材料 |
| **`resources/`** | 图片、音频等附件         | **附件**: 被笔记引用的媒体文件，不独立阅读        |
| **`posts/`**     | 对外博客（公开发表的成稿） | **对外**: 人仔细维护；AI 不得自动改写        |

### ⛔️ 拒收原则 (Not)

- 只在当下有用、不可复用的总结
- 无法进入判断链条的“聪明观点”
- 没有时间维度、无法被验证的结论

### ⚠️ 维护规则

1. **notes → edges** 不是搬运，是提炼。
2. edge 一旦形成，不回写历史；演化通过新增或替代体现。
3. 迁移到 archive 必须有明确原因。
4. **`knowledge/posts/` 是对外博客，由人维护**：存放将公开发表的成稿，不是内部 notes。AI 不得自动创建、编辑、移动、删除、重构或重写该目录下的任何文件。人类可在别处让 AI 起草，再由人粘贴或提交进 posts。

---

## 2. 用户命令 (bin/)

**`bin/`** 存放面向人的可执行命令（shell），由 `pnpm setup` 加入 `$PATH` 后可在任意目录直接调用。

- **`new-note`**: 笔记 ingest 的 git 实现（落盘、commit、push）。人可以直接调；agent 不要把它当机器契约。

面向 agent 的 CLI 项目在 [`extensions/clis/`](extensions/clis/README.md)（`edges-note`），不在 `bin/`。

> 项目自身的维护脚本（setup、release、migration 等）不在 `bin/`，见下一节 `scripts/`。
> skill 分发不在 `bin/`，见下方「接入初始化」。

---

## 3. 项目维护脚本 (scripts/)

存放本仓库开发者用于初始化、构建、清理、发布等**一次性或低频**操作的脚本。不会自动加入 `$PATH`，统一通过 `pnpm <script-name>` 入口调用。

- **`setup`**: 首次接入时初始化本地环境（注册 `bin/` 到 PATH、加载 `.env`）。对应 `pnpm setup`。
- **`link-agent-skills`**: 把 `extensions/skills` 里每个 skill 以相对软链挂到 `.agents/skills`（项目级发现位）。对应 `pnpm skills:link`。`npx skills` 装进来的 vendor 拷贝不动。

判据：换台机器克隆下来要重新跑一遍的 → `scripts/`；装好之后用户/Agent 天天用的 → `bin/`。

---

## 4. 外部连接 (extensions/)

`extensions/` 目录是 Edges 系统对外的**接口层**，供外部 Agent 或系统接入。

**收录标准**: 判据是「这是为了让 Agent / 外部系统接入或操作 Edges」，而不是「它是代码还是文档」。纯 markdown 同样属于 extensions。换 Agent、换机器带得走是必要条件，但不是充分条件——跨机器共用、却不绑定 Edges 的 harness 走 [`shared-extensions/`](shared-extensions/README.md)。

- **`clis/`**: 面向 agent 的 CLI 项目（`edges-note`）。本地有 shell 的 agent 优先走它。
- **`mcp-servers/`**: 标准化接口服务 (如 `new-note` server)，给**没有 shell** 的 AI 宿主。
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

# 项目级：extensions/skills 软链到 .agents/skills（vendor 拷贝不动）
pnpm skills:link

# 本机全局：写入 ~/.agents/skills；Claude Code 不读中枢，另建软链
pnpm skills:install
```

只想用 skill、不接入整套系统的话，不必克隆本仓库：

```bash
npx skills@latest add VirusPC/edges/extensions/skills
```

子路径不能省，原因见 [`extensions/skills/README.md`](extensions/skills/README.md)。

---

## 5. 跨机器共享扩展 (shared-extensions/)

`shared-extensions/` 是个人 agent harness 的真源：同一套扩展装到所有本地和云端机器，被所有 Agent 共用。

**收录标准**: 判据是「离开 Edges，换一台机器、换一个 Agent，我还要带着它干活吗」。和 `extensions/` 互斥。

- **`skills/`**: 不绑定 Edges 的通用 skill（不走 `npx skills add VirusPC/edges/extensions/skills`）。
- **`mcp/`**: MCP **配置**（连哪些 server）。Edges 自己的 MCP server 实现仍在 `extensions/mcp-servers/`。
- **`plugins/`**: Agent 插件。
- **`hooks/`**: Agent 生命周期钩子。

凭据只用环境变量占位，禁止写入实际 token。发现位在各机器的全局 Agent 目录（`~/.agents/skills` 等），不是本仓库的 `.agents/skills`。安装脚本尚未落地，有第一份真实内容时再加。

整层一份版本（[`VERSION`](shared-extensions/VERSION)、[`CHANGELOG.md`](shared-extensions/CHANGELOG.md)、tag `shared-extensions@`），不按单条扩展发版。记忆入口 [`shared-extensions/AGENTS.md`](shared-extensions/AGENTS.md)。细则见 [`shared-extensions/README.md`](shared-extensions/README.md)。

---

## 6. 工作区管理 (Workspace)

本项目采用 **pnpm workspace** 进行“服务端服务工作区”管理，实现环境隔离与统一调度。

### 核心操作

- **安装依赖**: `pnpm install` (在根目录执行)
- **启动 MCP Server**（无 shell 的宿主）:
  - 启动 New Note: `pnpm start:note-server`
  - 开发模式: `pnpm dev:note-server`
- **Agent CLI**: `pnpm cli:note -- --help`
- **通用的启动器**: `pnpm mcp:run <server-name> <command>`
  - 示例: `pnpm mcp:run new-note build`

### 结构规范

- `extensions/mcp-servers/*`: 独立的 MCP 服务单元，各自拥有 `package.json`。
- `extensions/clis`: 面向 agent 的 CLI 项目（workspace 成员 `edges-cli`，二进制 `edges-note`）。
- `bin/`: 面向人的可执行命令（shell，非 node 包），由 `pnpm setup` 加入 `$PATH`。 ingest 的 git 实现在这里。
- `scripts/`: 项目自身的维护脚本（setup、release、migration 等），通过 `pnpm <name>` 调用，不入 PATH。
- `tsconfig.base.json`: 共享的全局编译器配置。

---

## 7. 隐私与脱敏

> **前提：本仓库是公开仓库（`github.com/VirusPC/edges`）。** 任何写入的内容都等同于公开发表。
> 写笔记时的默认心智是「我在发博客」，不是「我在记私人日记」。

### 7.1 绝对不能进仓库 (Never)

以下内容一旦写入即为事故，不存在「先提交再清理」这个选项——git 历史无法真正删除：

| 类别 | 具体形态 |
|---|---|
| **凭据** | token、API key、密码、私钥、cookie、`.env` 实际值 |
| **个人信息** | 手机号、身份证、住址、非公开邮箱、他人真实姓名/花名 |
| **未公开 IP** | 专利交底书、未发布的方案评审材料、内部立项文档 |
| **二进制办公文档** | `.docx/.xlsx/.pptx` 等（正文与元数据都无法 diff 审查，已在 `.gitignore` 中拒收） |

### 7.2 必须脱敏后才能进仓库 (Redact)

公司内部信息不必一概不写——**方法论可以留，标识符必须去**。脱敏映射：

| 原始 | 替换为 |
|---|---|
| 内部域名与文档链接（`docs.<公司>.com/...` 等） | 整条删除，或写成「（内部文档，略）」 |
| 内部系统 / 自研 Agent 名 | `内部文档平台`、`内部 Agent A/B` 等占位代称 |
| 内部服务名、仓库名、代码路径、类全名 | 删除该行，或改写为通用描述 |
| 同事姓名与花名 | 改为角色（`POC`、`直属负责人`、`QA`） |
| 内部排期日期、具体量化指标 | 改为相对周次 / 量级（`第 3 周`、`一批`） |
| 内部通报、周报、评审记录的原文照搬 | 提炼为通用条目，不保留内部行文口吻 |

脱敏后在文件头加一行说明，让未来的读者知道这不是原文：

```markdown
> 本文为通用方法论记录，已移除具体公司内部系统名称、内部文档链接与排期。
```

### 7.3 截图是最容易漏掉的泄漏面

**文字脱敏了不等于截图脱敏了。** 截图会带上编辑器标签页文件名、终端路径、浏览器地址栏、侧边栏目录树、IM 窗口。

- 引入任何截图前，先实际打开看一遍，而不是只看文件名
- 内部系统 UI 的截图一律不入库；需要示意就自己造一个 demo 再截
- 判据：**这张图放到公开博客里，我会不会需要打码？** 会，就别放

### 7.4 写入与发现泄漏

1. **写入前自查**：向 `knowledge/` 或 `shared-extensions/` 写入内容时，先按 7.1 / 7.2 过一遍；命中就地脱敏，并说明改了什么。
2. **发现即上报**：在仓库任意位置发现疑似泄漏，立即停下并告知，不要默默修掉——需要知道它曾经存在过多久。
3. **历史重写必须仓库所有者确认**：`git filter-repo`、`git push --force` 属于不可逆操作。可以准备命令、做好备份（`git bundle create ... --all`），但执行必须由所有者本人完成。
4. **删文件 ≠ 删历史**：报告清理结果时，必须明确区分「工作区已清理」和「历史已重写」。

### 7.5 例行自查

```bash
# 内部标识符扫描（按需扩充 pattern）
grep -rIn -E '<内部域名>|<内部系统名>|<内部服务名前缀>' --include='*.md' . | grep -v node_modules

# 凭据形态扫描
grep -rIn -E '(api[_-]?key|token|secret|password)\s*[:=]\s*["\x27][^"\x27]{16,}' --include='*.md' --include='*.ts' . | grep -v node_modules

# 确认没有办公文档混入
git ls-files | grep -iE '\.(docx?|xlsx?|pptx?)$'
```

---

许可证为 [MIT](LICENSE)。仓库级版本记录见 [CHANGELOG.md](CHANGELOG.md)。Skill 各自发版，见 `extensions/skills/<name>/CHANGELOG.md`。Agent 入口是 [`AGENTS.md`](AGENTS.md)，硬约束写在那份文件里，目录约定仍以本 README 为准。