# 待整理的旧图片附件

这里保存内容目录迁移时未找到引用的 320 个旧 `img/` 附件，按用户要求归档，不删除、不猜测所属文章。

保存路径为 `archive/img/<原仓库相对路径>`。例如原来的 `edges/主题/img/图片.png` 位于 `archive/img/edges/主题/img/图片.png`；原层级和文件名完整保留，避免同名覆盖，也方便确认后恢复。

批量处理入口为 `pnpm migrate:content-units --root <工作树绝对路径> --archive-unused-img`，默认预览，添加 `--apply` 写入。已找到引用的附件与已经归档的内容不重复搬迁。
