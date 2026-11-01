# ADR 0011: 路径带日期，标题不带

## Status
Accepted

## Context
目录名带日期，用来排序和做 URL。标题再带同一串日期，读者看到的是路径而不是主题。

## Decision
路径用 `notes/YYYY-MM-DD--主题简述/INDEX.md`。`--title`、正文 `#`、frontmatter `title` 只写主题简述。

## Consequences
范例一级标题写 `# 主题简述`。旧笔记不回写。
