# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-25

### Added

- 迁自使用方 shared-extensions 的 `skills/langfuse-agent-tracing`（层版本 4.5.0，commit 4ae6ca8b）；目录改名为 `langfuse-local-agent-tracing`。主入口见 `langfuse-agent-tracing`。
- 去掉本机路径与笔记相对路径；Grok Bot 一行改指向 `langfuse-grokbot-tracing`。选错表面时回指主入口。
