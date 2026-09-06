---
name: project_mit_license
title: 整仓 MIT，不拆 knowledge 许可证
description: 给仓库选许可证、改 LICENSE 或 package.json license 字段时：整仓 MIT，不要给 knowledge/ 另开一份。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T20:06:34+08:00"
---

Edges 整仓使用 MIT，版权人 `viruspc`。根目录 `LICENSE` 与 `package.json` 的 `license` 字段是权威声明；`knowledge/` 不另开 CC 或其他许可证。

**Why:** 仓库公开，且用 `npx skills` 让别人装 skill。没有许可证时别人没有明确授权。Skill、MCP、脚本都是「拿去用」的形态，MIT 最省事。笔记按博客公开写，目前没有单独分发内容包，拆 CC BY 只会让两套许可证边界变糊。

**How to apply:** 不要删或替换 `LICENSE` 而不先问。新增的 `package.json`（例如新的 MCP）同样写 `"license": "MIT"`。若以后只想限制 `knowledge/` 的转载方式，再单独立项，不要默默改成双许可。
