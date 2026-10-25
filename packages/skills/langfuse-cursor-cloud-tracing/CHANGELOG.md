# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-25

### Added

- 迁自使用方 shared-extensions 的 `skills/cursor-cloud-langfuse-tracing`（层版本 4.4.0 起，交叉链接随 4.5.0）；目录改名为 `langfuse-cursor-cloud-tracing`，保留可执行的 `templates/langfuse.sh` 与 `templates/hooks.json`。
- 实例根地址改为占位 `https://langfuse.example.com`。去掉笔记相对路径与具体 environment 名称。选错表面时回指主入口 `langfuse-agent-tracing`。
