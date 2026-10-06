# Artifact 先存草稿，公开后才起算 TTL

2026-10-06 grill 确认：`edges artifacts create` 只保存草稿，`publish` 才公开。修订 [ADR 0013](0013-artifacts-preview-service.md) 里「上传即得到 URL」这一段。短生命周期托管、真浏览器可开 URL、与 `/tasks/` 的硬边界不变。

**Status:** accepted（ADR 0026；grill 确认于 2026-10-06）

**See also:** ADR 0013（[Artifacts 预览服务](0013-artifacts-preview-service.md)）

## Decision

- `create <path>` 上传文件并返回 id。此时没有公开 URL，TTL 不起算。
- `publish <id>` 公开已有草稿，返回 URL，TTL 从这次公开起算。
- `publish <path>` 仍可用：内部先 create，再公开。现有「对本地文件一步发布」因此保留。
- `delete` 取代 `rm`，草稿和已公开的包都能删。
- Artifact 不是叶子节点，不提供 list / get / update。
- 写操作仍要 token。公开之后的读取仍靠 UUID 与 TTL，不在这次改为登录。

## Considered Options

- 把今天的 `publish` 改名为 `create`，不增加草稿：否决。上传即公开和「先保存」是两种动作。
- 只保留 `create <path>` 与 `publish <id>`，删掉 `publish <path>`：否决。现有一步发布还要能用。
