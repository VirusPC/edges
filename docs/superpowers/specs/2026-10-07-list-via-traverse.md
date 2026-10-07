# List 只走树遍历或森林遍历

2026-10-07 grill 收口。不要在各业务 list 里再找板、再扫目录。

`--scope`、`--super`、`--all` 的组合形成一切。没有第二套范围开关。

## 决定

1. `--scope` 选定主体。不传 `--super` 时，主体是该目录上的真 `AGENTS.md`。
2. `--super` 把主体换成该 scope 上的虚拟系统一（`SuperAgentsNode`）。当前 scope 目录就是它的 `.harness`。材料路径 = `join(scopeDir, harness-materials.json 的 path)`。`harnessRootForScope` 只表示这个 scope 自己的 `<scope>/.harness`，超节点不再调用它。
3. 不传 `--all`：对这个主体做一次 `NodeService.query` / `traverse`。真系统的 `children` 含本层与下层系统。
4. `--all`：`buildSystemForest`，森林从当前 `--scope` 出发，每个系统根一次 `traverse`。同时有 `--super` 时 `includeSuper: true`。最全的一次查询是 `--scope <仓库根> --super --all`。
5. `--all` 与 `--scope`、`--super` 同级，挂在根命令上。走节点树的 list 都读它：`tasks list`、`tasks project list`、`memory list`、`skill list`、`note list`。筛选发生在遍历结果上。`forest list` 本身就是森林。`schema list` 列契约，不读 `--all`。
6. 遍历时已登记但磁盘上不存在的入口：跳过，不中断。写操作缺文件仍然报错。
7. Tasks 不理解用途，也不理解 index-group。它只看主体系统，然后往这个系统的 `.harness/tasks` 里写。一般 `--scope` 就是主体：看板是 `<scope>/.harness/tasks`。主体是仓库之外的虚拟系统一时，用 `--scope <仓库根> --super`；该系统的 harness 就是传入的 scope 目录，看板是 `<仓库根>/tasks`。
8. 实现完成后再交报告：仓库根与 `<仓库根>/.harness`，在默认、`--super`、`--all`、`--super --all` 下各 list 的实际结果。实现前不跑。

## 不改

- `traverse` 仍只跑单系统；森林仍在 `buildSystemForest` 外面拼。
- 看板内部仍是 `project/status/INDEX.md`。`tasks list` 不再为了列出任务去打开某一块板。
- `generate-tasks-site.ts` 的部署调用本轮不动。用户命令不再接收用途参数。
- 不改 `posts/`。
