# Commands 与 Service 解耦：现成方案

2026-10-06。Grill 已锁定契约（ADR 0026、0027、0028）。这篇只记录现成代码和一手来源能复用什么。没有来源要求改那些决定。

## 退出码

手写一个约 30 行的共享函数，不要引入 `sysexits`。

- [clig.dev](https://clig.dev/) 只要求成功为 0、失败非 0，并把重要失败模式分开。机器可读输出走 stdout，诊断走 stderr。它不规定 2、4，也不规定失败 JSON 的字段。
- [POSIX.1-2024 1.4](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap01.html) 规定成功通常是 0，大于 0 表示错误。未写明具体数字时，调用方只应判断是否为 0。它不要求用法错误必须是 2，也没有认证码。
- [POSIX shell 2.8.2](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 保留 126、127 和大于 128。1、2、4 可以由应用自己定义。
- [FreeBSD sysexits(3)](https://man.freebsd.org/cgi/man.cgi?query=sysexits&sektion=3) 把用法放在 64（`EX_USAGE`），权限放在 77（`EX_NOPERM`）。手册写明这个接口已弃用，只为兼容保留，而且不可移植。
- [Commander.js](https://github.com/tj/commander.js/blob/master/Readme.md) 在省略 `exitCode` 时把用法错误退出为 1。`exitOverride()` 可以接住 `CommanderError`，再交给我们的函数。文档允许调用方传入 `{ exitCode: 2 }`。

没有来源说 2 和 4 不能同时使用。

## 对象与数组的文本

本地写按键名排序的 `stableStringify`，大约 40 行。不新增依赖。

- [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) 的键排序只是其中一步。它还要求 I-JSON、按 ECMAScript 序列化数字、拒绝 `NaN` 与 `Infinity`，并输出 UTF-8。`4.50` 会收成 `4.5`。这比「排序后 `JSON.stringify`」重。
- `fast-json-stable-stringify` 的 README 示例保留数组顺序、排序对象键。循环引用默认抛错，打开 `cycles` 会写出非法 JSON。README 没有写最近发布或归档，维护信号未核实。`substack/json-stable-stringify` 的原地址返回 404。
- 三份主源都没有说键排序会把不同的值并成同一个。`Object.keys(obj).sort()` 的顺序与 RFC 8785 §3.2.3 的 UTF-16 码元序一致。

## 仓库里已经有的代码

来源是当前树，不是外部库。

- 预览服务 `extensions/services/artifacts-preview/src/server.ts` 的 `POST /artifacts` 写入后即可 GET。响应是 `{ id, url, expiresAt }`，可选 `from`。没有草稿态。TTL 在这次 POST 上起算。
- `/tasks/` 不执行 `edges tasks list --group-by`。`.github/workflows/deploy.yml` 运行 `extensions/cli/scripts/generate-tasks-site.ts`，由 `generateTasksSite` 调用 `listGroupedByProject` 或 `listRepositoryGroupedByProject`，再调用 `groupedListToReviewPageInput`。该函数要求 `schema === "edges.tasks.grouped/v1"`，条目带 `group`，映射后 `current` 与 `suggested` 都等于这个 `group`。
- `services/` 里只有 `services/tasks/result.ts` 引用 `CliContext`。`utils/config.ts` 的 `loadConfig` 引用 `services/scope.ts`。`utils/exit.ts` 引用 note 与 tasks 的错误类型。
- Memory 没有 list / get / delete 用例。Note 只有 `runIngest`。没有 `services/skill/`。`commands/artifacts/server/ops.ts` 已导出 install、start、stop、restart、status、setup-nginx，入参是 `env` 而不是 `CliContext`。

## 对计划的含义

先做共享退出码函数，并把 `CliContext`、`loadConfig`、退出码移出 Service。分组输出改掉之后，要改 `generateTasksSite` 及其映射，不能只改 `edges tasks list` 的 stdout。Artifact 草稿要改 `artifacts-preview` 的存储和 HTTP，再改命令。Memory、Note、Skill 的真执行动词没有现成用例可包一层。
