# 设计评审 Coding Agent Skills 调研（2026-09）

> 源码与文档调研快照（约 2026-09-24）。尚未在同一项目上做效果对照。安装数来自 skills.sh 页面快照；安装数 ≠ 独立用户数，仓库 Star ≠ 单项 Skill 采用量。

## 结论（评审优先）

偏「评审」优先看：

1. **Impeccable**（`pbakaus/impeccable`）— 综合设计评审 / 技术审计 / 视觉打磨
2. **web-design-guidelines**（`vercel-labs/agent-skills`）— 按 Web 界面规范审查代码
3. **gstack** 两项（`garrytan/gstack`）— 实现前方案评审、实现后页面检查与修复（流程重，勿轻易整包引入）
4. **Emil** 动效专项（`emilkowalski/skills`）— `review-animations` / `improve-animations`

另外很知名、但更偏**设计生成与改造**、不能直接等同完整评审流程：

- `frontend-design`（anthropics/skills）
- Taste Skill（`design-taste-frontend`，Leonxlnx/taste-skill）
- UI/UX Pro Max（nextlevelbuilder/ui-ux-pro-max-skill）

第二批可试：`interface-design`（Dammyjay93）— 看板 / 后台 / SaaS / 工具型界面一致性。

## 热度证据（快照）

| Skill / 来源 | 核心定位 | 热度证据 |
| --- | --- | --- |
| impeccable · pbakaus/impeccable | 设计评审、技术审计、视觉打磨与迭代 | 约 29.1 万安装 |
| web-design-guidelines · vercel-labs/agent-skills | 按 Web 界面规范审查代码 | 约 66.4 万安装 |
| plan-design-review / design-review · garrytan/gstack | 实现前方案评审；实现后检查与修复 | gstack 仓库约 13.4 万 Star（非整项 Skill） |
| review-animations · emilkowalski/skills | 动效与微交互专项审查 | 约 17.5 万安装 |
| frontend-design · anthropics/skills | 视觉方向、排版与高质量界面生成 | 约 91.8 万安装 |
| design-taste-frontend · Leonxlnx/taste-skill | 避免模板化、控风格与表现力 | 约 51.5 万安装 |
| ui-ux-pro-max · nextlevelbuilder/ui-ux-pro-max-skill | 可检索设计知识库与多技术栈指导 | 约 36.9 万安装 |
| interface-design · Dammyjay93/interface-design | 产品型界面、跨页一致性与设计评审 | 约 2.75 万安装、约 5,700 Star |

## 四条评审路线

### 1. Impeccable — 综合设计评审（优先试用）

价值是把设计工作拆开，而不是再加一句「让页面更好看」。

当前是一个 `impeccable` Skill + 子命令（勿把旧文里的独立 `/audit`、`/critique` 默认当独立 Skill 名）。主要分工：

| 调用 | 解决的问题 |
| --- | --- |
| `/impeccable critique` | 信息层级、清晰度、认知负担、体验是否合理 |
| `/impeccable audit` | 可访问性、性能、主题、响应式等实现质量（只报不改） |
| `/impeccable polish` | 最终视觉打磨、设计系统对齐、交付检查 |

README 约 24 个子命令。`critique` 要求把独立设计判断与检测器 / 浏览器证据分开再综合；含 Nielsen 启发式，评审快照可落到 `.impeccable/critique/`。另有约 61 条确定性检测规则，可 CLI 出 JSON，也可经 Hooks 在编辑后反馈——已不只是提示词集合。

**判断：** 综合界面评审首选。须用团队自有品牌 / 组件 / 设计规范校准，勿把作者偏好的字体、颜色、动画风格直接当硬门禁。

### 2. Vercel web-design-guidelines — 最适合先建基础检查

机制：拉取最新规范 → 读指定文件 → 按规则检查 → 输出 `file:line` 问题清单。覆盖图标按钮可访问名、表单标签、语义元素、异步状态是否可被辅助技术感知等。

**适合：** Web / React 日常 UI Code Review、组件提交前检查、团队界面质量底线。

**边界：** 模型按规范审代码，不是确定性 Linter，也不是完整真实页面体验测试；不能仅靠读文件判断全部层级、触控与完整用户路径。

**落地建议：** 试用跟最新规范；正式作团队检查项时**固定规范版本**，避免隔几天标准漂移。

### 3. gstack — 最贴近「设计评审流程」，但更重

- **plan-design-review**（实现前）：补齐尚未作出的设计决策（信息层级；每项功能的 loading / empty / error / success / partial——用户看到什么，不是后端发生什么）。
- **design-review**（可运行界面后）：查视觉不一致、间距、层级、模板化、慢交互；改源码、按项提交，并用改前后截图复核。这是评审+修复。

当前 gstack 可将 Impeccable 确定性检测作前置，也可共享 `PRODUCT.md` / `DESIGN.md`。

**判断：** 适合团队流程参考或需要完整闭环的个人项目。不建议为一次设计检查未经评估就引入整套（脚本、浏览器、Git；要求干净工作区）——不是拷贝一个 Markdown 就完成集成。

### 4. Emil — 动效手感专项

动效评审只是交互评审的一部分，不等于整产品流程评审。

- **review-animations：** 审具体改动——是否必要、频率、缓动时长、可否中断、起点、性能、reduced-motion；输出含位置、建议、原因、通过/阻止。高频操作可能建议删减动画；阈值先当建议再决定是否进门禁。
- **improve-animations：** 审整仓并生成改进计划；默认可只写 `plans/` 供另一 Agent 执行（Builder / Reviewer 分工友好）。

## 生成向选项何时用

| Skill | 何时用 |
| --- | --- |
| frontend-design | 生成端基线（活动页 / 原型），再用 Impeccable / Vercel 评审 |
| Taste（design-taste-frontend） | 生成质量对照组；注意主版本可能标 experimental |
| UI/UX Pro Max | 缺设计系统时快速建方向；已有规范时先要求复用现有系统 |
| interface-design | 看板 / 后台 / 知识工具长期一致性；第二批专项试 |

## 易混边界

- **Rams：** 免费 Skill 是轻量指定文件检查；完整规则引擎 / 持续评分 / 自动 PR 属 MCP / GitHub App 等产品能力，勿混为一谈。
- **RN vs Web：** Impeccable audit 可按平台路由原生指南；Emil 有 `animate-expo`。Web 的 DOM / CSS / ARIA 与原生检查应分开。

## 实际选择与最小试用

| 目标 | 建议 |
| --- | --- |
| 已有页面：是否清晰、好用、协调 | Impeccable critique |
| Web 提交前界面规范 | web-design-guidelines |
| 需求/方案阶段补齐路径与状态 | gstack plan-design-review |
| 微交互/动效专项 | review-animations |
| 整仓动效改进任务 | improve-animations |
| 看板/后台/知识工具长期一致性 | interface-design |

最小试用安装示例：

```bash
npx impeccable install
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
npx skills add emilkowalski/skills --skill review-animations
```

**试点度量：** 同一批真实页面比——问题采纳率、误报率、扣除核查返工后净省时间。不要用 Skill 自评分作效果证明。

**最终优先级：** 综合评审先试 Impeccable；轻量 Web 规范选 Vercel；流程设计参考 gstack；动效专项选 Emil。

## Grok Bot 侧备注（2026-09-25）

- 本笔记对应试用：将上述三条评审 Skill 装入 Grok Bot 共享 skill 库（`impeccable` / `web-design-guidelines` / `review-animations`）。
- Figma / 纯截图、尚无代码时，仍可用轻量 Anthropic `design-critique`；勿硬套 Impeccable 实现层路径。
- Mobbin 适合竞品对标，不是评审本体；已装插件需登录后才可用。
