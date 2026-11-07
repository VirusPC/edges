# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.2] - 2026-11-07

### Changed

- 开场保留选项，但先列用户场景：维护整个现有项目、维护某个目录或模块（目录不一定属于代码项目）、个人大脑、个人可复用的方法和 skills、团队共享规范。上下文已经明确就沿用，缺了再问。
- 在已有位置添加、新建独立仓库只在场景对不上或用户想直接选方式时兜底。用户明确只安装 CLI 时，只做安装和验证。

## [0.6.1] - 2026-11-07

### Fixed

- 补发接入保障修订：保留紧凑结构，包含环境检查、内容与凭证保护、GitHub 用户授权和精简排错。既有 0.6.0 tag 保持不变。

## [0.6.0] - 2026-11-07

### Changed

- 保持三个主章节，在接入流程内补回环境检查、内容与凭证保护边界、GitHub 用户授权和精简排错；验证仍留在各流程，不恢复常用操作百科。
- 接入前按流程集中收集必要信息，沿用上下文中的已有选择；仅本地接入跳过 GitHub 信息，授权后连续执行，遇到新冲突再询问。
- 用户场景映射到两种流程：已有项目添加 edges harness 目录、创建独立 edges harness 仓库。精简文档，按流程组织操作步骤。
- 独立 harness 完整接入包含 GitHub 建仓、首次提交推送与远程读回验证，同时支持用户明确选择仅本地。显式区分 private/public 的内容边界与挂载权限，未指定可见性时先询问。

## [0.5.0] - 2026-11-04

### Changed

- **默认把 skill 装进当前项目。** 示例改为 `edges --scope . init -- -y`。`-g` 仍可用于本机用户目录。

## [0.4.1] - 2026-11-03

### Changed

- 全局安装改为 `npm install -g @viruspc/edges@latest`。`edges --version` 只要求打印版本号，不再写死写作时的 npm 版本。

## [0.4.0] - 2026-11-02

### Changed

- 接入说明补充递归 Project 的直属材料与初始化行为，区分 scope、Project、Super 内容入口和 All 系统发现。
- 任务示例采用无 Task Project、无 `_default` 的布局；补充 Project 中创建、检索笔记与子主题的命令。
- 无 shell 的 Notes 入口补充 MCP 的 `project` / `super` 选择及固定服务端 scope 边界。

## [0.3.0] - 2026-11-02

### Changed

- 接入验证与笔记读写示例对齐统一材料定位，默认使用 `.edges/notes/`；提示使用返回路径并区分旧版 0.4.1 的落点，避免将版本差异误判为安装失败。

## [0.2.2] - 2026-10-27

### Changed

- **任务归类：** 整板按 Task Project 归类改回独立 skill `edges-tasks-classify`。写笔记、初始化和组合仓库仍走 `edges`。

## [0.2.1] - 2026-10-27

### Changed

- **入口：** 写笔记、初始化系统入口、任务分类和组合仓库改走总入口 `edges`。检索与沉淀仍是 `edges-memory-ask` / `edges-memory-remember`。

## [0.2.0] - 2026-10-27

### Changed

- 材料目录与示例路径改为 `.edges`。写作时对应的 npm 版本改为 `0.3.0`。

## [0.1.1] - 2026-10-20

### Changed

- 无 shell 宿主的笔记入口改为仓库根 `packages/mcp-servers/new-note`。安装与 init 步骤不变。

## [0.1.0] - 2026-10-19

### Added

- 新增接入引导：前置检查、安装 `@viruspc/edges`、`edges init`、临时目录验证、常用命令、错误排查与凭证硬规则。当前没有 login 命令；需要凭证的步骤由用户在自己的终端完成。
