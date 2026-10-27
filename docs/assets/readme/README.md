# README 配图

配图服务于同一条阅读路径：先用插画表达经验的延续，用总览图理解人与 Agent 怎样借助 Edges 工作；在「为什么值得用」中，用模块图说明关键工作的专门设计，再看目录结构如何展开与组合、设计选择如何支持长期使用。通过 Agent 开始使用后，可在「深入了解」中按需展开各模块的设计与用例。

| 文件 | 用途 | 制作方式 |
| --- | --- | --- |
| [hero.png](hero.png) | 首屏概念插画；纸张与目录表达经验的积累和延续 | Codex 内置 image generation，2026-10-26 生成；未使用 CLI / API fallback |
| [overview.svg](overview.svg) | 开头系统总览；人的目标与审阅、Agent 的工作，以及目录中可继续使用的积累 | 手工编写的原生 SVG，文字可编辑，无外部资源 |
| [design.svg](design.svg) | 三种组织方式；monorepo 子 app 的任意目录建立、以 Skill 开发说明递归使用、挂入共享 harness 并利用和沉淀知识 | 手工编写的原生 SVG，文字可编辑，无外部资源 |
| [foundations.svg](foundations.svg) | 长期使用的四项优势；可读可迁移、可追溯可审阅、跨 Agent 任务接力、零运维与现成服务接入 | 手工编写的原生 SVG，文字可编辑，无外部资源 |
| [modules.svg](modules.svg) | 十个模块的用途与共同基础 | 手工编写的原生 SVG，文字可编辑，无外部资源 |

总览图解释系统作用：Agent 读取目录中的背景与方法，推进工作，再留下材料与经验，供后续会话使用；人提出目标并审阅。箭头表达协作与读写关系，具体操作由 Agent 及接入平台执行。

设计图用具体例子解释同一套结构怎样扩展，用绿色表示 harness，并按对象命名为「web 的 harness」「项目的 harness」「Skill 的 harness」。左侧在白色的 monorepo 子 app `apps/web/` 中建立自己的 harness，沿途目录和同级 app 不要求一起初始化。右侧从项目本身开始，依次嵌套项目的 harness、代码审阅 Skill、Skill 的 harness；白色项目与 Skill 是两层维护对象，各自的绿色 harness 重复同一视觉样式。任务、记忆、技能等维护材料可以再次用于维护这份方法。这里强调维护对象改变后，同一结构仍然成立，省去中间存储路径与文件清单。每次初始化仍针对选定目录，不表示递归扫描或自动自我改进。

下方从已有项目仓出发，再接入额外的个人知识库。左侧白色的当前项目仓是叙事主体，内部标注「当前项目内容」；右侧绿色块标题为「共享的 harness 仓库」，下一行以「个人大脑」说明这个例子。两者是平级的独立仓库，分别保留归属与 Git 历史。Compose 虚线从两块上方折起，表示项目对大脑仓的引用关系；知识与方法从右侧大脑用于左侧项目，工作中产生的新经验沉淀到同一份大脑。实际写入发生在对应仓库的检出目录中，提交和推送仍由 Git 完成；图中不表示自动同步，也不约定各模块的实际存储路径。三种方式可以按需采用，没有必经顺序。依据见[初始化说明](../../../packages/skills/edges-memory-init/SKILL.md)、[递归系统设计](../../adr/0029-recursive-system-two-entries.md)、[Compose 设计](../../adr/0042-compose-on-git-submodule.md)与[挂载仓库可写](../../adr/0045-compose-checkout-writable.md)。

长期使用优势图将设计选择与使用收益对应起来，不是模块分类或操作流程。Git 的跟踪与忽略规则控制是否纳入共享版本，不代表文件访问权限；跨 Agent 卡片强调任务接力，任务背景、目标与执行记录随项目保留，接手者需要接入目录与入口、访问同一份最新材料，各入口的能力覆盖以文档为准；零运维强调核心内容本地可用，观测、评测和在线预览提供开箱即用的接入服务；CLI 提供服务端启动能力，Agent 可以完成启动与接入流程。服务的环境、授权与配置要求由对应能力文档说明。依据见[CLI](../../../packages/cli/README.md)、[能力面设计](../../adr/0004-capability-surface-cli-skill-mcp.md)及根 README 链接的服务文档。

模块图按用途组织，不规定执行顺序，也不要求各组互斥。Tasks 与 Routines 分别记录具体任务和重复工作的安排；Observation 留存不同 Agent 下的个人会话，为分析日常工作与检查 harness 内容是否仍然适用提供材料，Evaluation 用对照实验验证改进效果；Compose 单独表达跨仓复用，也能为其他模块接入外部积累。模块说明以[根 README](../../../README.md#深入了解)及其引用的能力文档为准。更新模块职责时同步检查图中文字；图片的替代文字保留在根 README 中。

## 首屏插画的最终提示词

以下是提交给内置图像生成工具的完整提示词。生成时使用不透明背景，直接保留生成的 PNG。

```text
Use case: stylized-concept
Asset type: editorial hero illustration for the GitHub README of Edges, an open-source system for directory-based work memory and reusable collaboration methods.
Primary request: A beautiful, thoughtful wide illustration expressing “experience becomes the starting point of the next piece of work.”
Scene/backdrop: warm off-white paper background, calm and spacious.
Subject: a finely composed miniature landscape of open folder forms and layered paper cards. On the left, a few loose pages represent captured experience; in the middle, stacked folder-like architectural forms organize that experience; toward the right, a clear new path unfolds from the accumulated layers into a fresh open sheet. A restrained teal curved thread quietly links these forms and loops back, suggesting continuity and learning.
Style/medium: premium contemporary editorial illustration, precise geometric construction with subtle tactile paper depth, beautiful restrained soft shadows, sophisticated rather than playful.
Composition/framing: panoramic 3:1 banner; visual story spans the width with generous whitespace around every edge; medium scale objects with a clear visual hierarchy; no crowded detail.
Lighting/mood: soft natural light, quietly optimistic, lucid and welcoming.
Color palette: warm ivory #F7F6F2, deep ink navy #18333F, muted teal #438D85, with one or two small amber #D9A358 accents.
Materials/textures: matte paper, very subtle fine grain, no glossy plastic.
Text: none.
Constraints: no words, letters, numbers, labels, logos or watermark; no brain illustration, robots, neon glow, network-node wallpaper, fake UI screenshots, or decorative arrows. This is a conceptual illustration, not a literal diagram. Crisp silhouettes, professional visual polish, balanced asymmetry.
```
