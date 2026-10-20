---
name: project_node_esm_ts_import_js
description: 写 Node ESM TypeScript（nodenext、tsc 出 JS）时：相对 import 用 .js，不要写 .ts，也不要省略扩展名。
metadata:
  edges-title: Node ESM + TS 相对导入写 .js
  edges-type: project
  edges-origin-session-id: 5ca778a1-f3bd-43ba-89e3-0aee6fca2946
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-15T15:15:35+08:00"
---

本仓 Node ESM + TypeScript（`module`/`moduleResolution`: NodeNext，`tsc` 出 JS 再交给 Node）的相对 import 写 `.js`，不写 `.ts`，也不省略扩展名。

**Why:** import 路径是运行时 specifier，不是源文件名。`tsc` 默认不改写路径；Node ESM 又必须带扩展名。TypeScript 在 nodenext 下用 extension substitution：源码写 `./foo.js`，类型检查去找 `foo.ts`。这是 TypeScript 手册对 Node 的约定。用户于 2026-09-15 确认按此行业默认，不要改成源码写 `.ts`。写 `.ts` 只适用于另一条链路（Node type stripping 直接跑 TS，或显式开启 `rewriteRelativeImportExtensions`）；bundler 包才常省略扩展名。

**How to apply:** 相对路径写成 `from "./note/index.js"`。包名（`commander`）不带扩展名。不要为了「更直观」把已有相对 import 改成 `.ts`。若某包改为 bundler/`noEmit` 或不经 `tsc` 出 JS，再另议。
