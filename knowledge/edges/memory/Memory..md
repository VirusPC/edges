
# Memory 类型

从**记忆作用域（scope）**的维度，我们将 Agent 的记忆体系划分为四个层级——这里的分类标准不是”记忆里装了什么内容”，而是”这部分记忆对哪些任务、会话、项目可见”。
1. Working Memory（工作记忆）
Agent 在当前任务执行链路上主动维护的短期工作区，包括当前的 plan、中间推理状态、scratchpad 等。它通过上下文窗口呈现给模型，但并不等同于上下文窗口本身——上下文里还会承载 system prompt、检索注入的长期记忆片段等其他来源的信息，Working Memory 只是其中被 Agent 主动读写的那个子集。
2. User Memory（用户记忆）
作用域绑定到”用户”主体的长期信息，跨项目、跨会话生效。典型内容包括职业身份、所属组织、技术栈偏好与行为习惯等。
3. Project Memory（项目记忆）
作用域绑定到具体项目的上下文沉淀，仅在该项目内部的会话间共享。在网页端 Chatbot 场景下，通常通过虚拟项目空间来实现——聚合相关会话，并承载项目内可共享的系统指令与资源；在本地 Agent 场景下（如 Claude Code、CoWork），则直接映射到一个真实的文件目录——AGENTS.md、Skills 目录、SDD 的 spec 文件夹等，本质上都是项目级记忆的物化形态。
需要强调的是，User Memory 与 Project Memory 的分界不是内容类型，而是作用域本身：同一条”偏好用 TypeScript”，如果在该用户的所有项目里都稳定成立，就归属 User Memory；如果只在某个具体仓库里成立，就归属 Project Memory。Claude Code 中 ~/.claude/CLAUDE.md（用户级）与项目根目录下 CLAUDE.md（项目级）的分层设计，正是这种作用域切分的工程化体现。
4. Team Memory（团队记忆）
作用域跨越多个项目、对团队成员共享的知识资产。典型如前端开发知识库——它沉淀的是可在不同仓库、不同项目之间稳定复用的领域知识。


我们项目的关注点不在User Memory，而是在Scope更广的团队Memory和项目Memory上。

# Project memory




# Team memory