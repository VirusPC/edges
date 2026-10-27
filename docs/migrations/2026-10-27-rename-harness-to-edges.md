# 2026-10-27：材料目录 `.harness` 改为 `.edges`

决定见 [ADR 0047](../adr/0047-rename-harness-directory-to-edges.md)。硬切断：目录只认 `.edges`，层标记只认 `edges` / `edges-*`。不留旧路径别名，运行时不双读。布局就此冻结，不借这次更名改模块结构。

本仓用 `git mv` 与文本改写直接改完，**不附带可执行迁移脚本**。外部仓库用下面的临时脚本自己迁，脚本放在 `/tmp`，不要提交。

## 还停在 `.memory` 时

`@viruspc/edges@0.3.0` 没有 `edges memory migrate`。材料若还在 `.memory/`，先装上一版并迁完，再改目录名：

```bash
npm install -g @viruspc/edges@0.2.7
edges memory migrate --dry-run
edges memory migrate
```

0.2.7 写完的材料目录仍叫 `.harness`。接着做下面这一步，再安装 0.3.0。

## 外部仓库

在仓库根保存下面的脚本（例如 `/tmp/rename-harness-to-edges.mjs`）。默认只打印。确认清单后再加 `--apply`。

脚本做两件事：把名为 `.harness` 的目录改成 `.edges`（深的先改），以及改写文本里的 `.harness` 路径和 `<!-- project-harness` 标记。`project-memory` 与 `project-entries` 不动。历史文件名里的 `project-harness`（任务 slug、旧规格文件名）不改。`.harness` 与 `.edges` 同时存在时停止，不覆盖。

```javascript
#!/usr/bin/env node
// 临时脚本，不要提交。默认只打印；--apply 才改。
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const apply = process.argv.includes("--apply");
const rootFlag = process.argv.indexOf("--root");
const root = path.resolve(rootFlag >= 0 ? process.argv[rootFlag + 1] : ".");
const skip = new Set([".git", "node_modules", "dist", "build", ".pnpm-store"]);

function walk(dir, visit) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      visit(abs, ent);
      walk(abs, visit);
    } else if (ent.isFile()) visit(abs, ent);
  }
}

if (fs.existsSync(path.join(root, ".memory"))) {
  console.error("仍有 .memory/。先用 @viruspc/edges@0.2.7 的 edges memory migrate，再跑本脚本。");
  process.exit(2);
}

const dirs = [];
walk(root, (abs, ent) => {
  if (ent.isDirectory() && ent.name === ".harness") dirs.push(abs);
});
dirs.sort((a, b) => b.length - a.length);

for (const abs of dirs) {
  const dest = path.join(path.dirname(abs), ".edges");
  if (fs.existsSync(dest)) {
    console.error(`冲突：${dest} 已存在，未改 ${abs}`);
    process.exit(1);
  }
  console.log(`${apply ? "rename" : "would rename"} ${path.relative(root, abs)} -> ${path.relative(root, dest)}`);
  if (!apply) continue;
  const git = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, encoding: "utf8" });
  if (git.status === 0 && git.stdout.trim() === "true") {
    const mv = spawnSync("git", ["mv", abs, dest], { cwd: root, encoding: "utf8" });
    if (mv.status !== 0) {
      console.error(mv.stderr || mv.stdout);
      process.exit(mv.status ?? 1);
    }
  } else {
    fs.renameSync(abs, dest);
  }
}

const textSkip = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".woff", ".woff2", ".zip", ".tgz"]);
let rewritten = 0;
walk(root, (abs, ent) => {
  if (!ent.isFile() || textSkip.has(path.extname(ent.name).toLowerCase())) return;
  let source;
  try {
    source = fs.readFileSync(abs, "utf8");
  } catch {
    return;
  }
  if (source.includes("\u0000")) return;
  const next = source
    .replaceAll(".harness", ".edges")
    .replaceAll("<!-- project-harness", "<!-- edges");
  if (next === source) return;
  rewritten += 1;
  console.log(`${apply ? "rewrite" : "would rewrite"} ${path.relative(root, abs)}`);
  if (apply) fs.writeFileSync(abs, next);
});
console.log(`${apply ? "done" : "dry-run"}: ${dirs.length} directories, ${rewritten} files`);
```

```bash
node /tmp/rename-harness-to-edges.mjs --root .
node /tmp/rename-harness-to-edges.mjs --root . --apply
```

改完后抽查 `AGENTS.md`：外层是 `<!-- edges:start -->`，三章是 `edges-constraints`、`edges-local`、`edges-descendants`，Compose 是 `edges-compose`。正文里如果还把标记写成 `project-harness` 而不是注释，把那处标记名改成 `edges`。然后安装 `@viruspc/edges@0.3.0`。`edges init` 在新作用域写出 `.edges/`。

`pnpm migrate:project-harness-markers` 不是这次的迁移器。它只把更早的 `project-memory` 层标记升到现行 `edges` 标记，不改目录名。

## 本仓更早的迁移说明

[平铺说明](2026-10-20-flatten-extensions.md) 与 [workspace 说明](2026-10-20-packages-workspace.md) 里的材料目录前缀已写成现行名 `.edges`。当时的目录名是 `.harness`。评测与观测在更名之前已经挪到 `packages/evaluation` 与 `packages/observation`，不要在 `.edges/` 下重建这两项目录。
