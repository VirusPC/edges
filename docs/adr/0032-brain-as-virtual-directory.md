---
status: accepted
---

# harness 落成仓库，大脑是虚拟目录，经验按谁 × 在哪沉淀

2026-10-08 至 10-09 重写根 README 的 grill 确认：任何目录都能配一套 harness（`AGENTS.md` 加 `.harness/`），由用户对选定目录 init。一个人的大脑被看作一个不落盘的虚拟目录，位于此人自己的仓库之上；它的 harness 落成一个 Git 仓库（作者的那一个就是本仓）。code agent 经各客户端的用户级配置接到这个仓库，personal agent 在自己的电脑上 clone 它；各类 Agent 机制相同，区别只在 harness 对象是哪个目录。经验按「谁 × 在哪」沉淀：在哪由目录决定；谁由共享范围决定，也就是提交进哪个仓库、谁能访问。团队仓库的上一层是团队，不是某个人的大脑；个人的大脑 harness 在他进入团队仓库时叠加生效。一个大脑只设一个 harness 仓库。被 gitignore 的用户记忆只放密码等隐私材料，不构成「谁」的一层。

## Considered Options

- **大脑落成本机物理父目录（如 `~/projects/`）：** 否决。Codex 等客户端的发现只到仓库根为止，personal agent 的云电脑上也没有本机目录树。
- **大脑纯虚拟，不落盘任何 harness：** 否决。personal agent 要装的必须是可以 clone 的实物。
- **把 personal agent 当成特殊机制：** 否决。把大脑看成目录以后，它与 code agent 走同一套机制。
- **大脑是所有仓库的父目录：** 收窄。团队仓库会因此有多个父节点，与单父归属冲突，改为按共享范围叠加。
- **一个大脑拆成公开、私有两个 harness 仓库：** 否决。这会打破「一个目录一个入口」；私密内容如何随 personal agent 同步另议。

## Consequences

- 对外分发的能力给用户的是目录自进化：`extensions/` 的 skill 以实体拷贝安装，CLI 尚未发布。改进机制本身的递归自我改进只在本仓发生，成果随升级交给用户。
- 其他仓库里的 code agent 接入大脑 harness、`--super` 跨多个仓库、团队这一层的 harness 仓库，目前都还没有实现。
- 术语见 `CONTEXT.md` 的「大脑（虚拟目录）」「Personal Agent」「共享范围」。
