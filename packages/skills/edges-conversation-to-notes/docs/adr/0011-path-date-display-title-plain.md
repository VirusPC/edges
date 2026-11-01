# ADR 0011: 路径名带日期，显示标题不带

## Status
Accepted

## Context
目录名 `YYYY-MM-DD--主题简述` 用来排序和做 URL。曾把同一串写进 Output Format 的 `#` 标题。正文已有一级标题时，CLI 会把存储标题对齐到该 H1，带日期的标题就出现在博客上。

## Decision
日期只放在路径 `notes/YYYY-MM-DD--主题简述/INDEX.md`。显示标题（`--title`、正文 `#`、frontmatter `title`）只写主题简述，不带日期前缀。

## Consequences
范例 H1 是 `# 主题简述`。已经入库、标题里带日期的旧笔记不强制回写。
