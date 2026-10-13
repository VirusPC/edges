# Artifact 草稿再公开 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `edges artifacts create` 只保存草稿；`publish <id>` 才公开并开始 TTL；`publish <path>` 仍是先创建再公开。

**Architecture:** 预览服务的 store 增加未公开状态。`POST /artifacts` 可以带 `publish: false`。公开是对已有 id 的第二次写。CLI 的 `create` 调用不公开的保存，`publish <path>` 在命令里连续调用创建和公开。`delete` 继续删除两种状态。

**Tech Stack:** 现有 `extensions/services/artifacts-preview` 与 `services/artifacts`。不新增列表或 get 命令。

**Spec:** ADR 0026。

## Global Constraints

- 草稿没有公开 URL，TTL 不起算。
- 公开之后的读取仍不登录，靠 UUID 和 TTL。
- `rm` 这个命令名已经不在本计划范围；当前命令名仍是 `rm`，改名为 `delete` 与本计划一起做。
- 不提供 artifacts list / get / update。

## Tasks

### Task 1: store 区分草稿

`meta.json` 增加 `published: boolean`。未公开的 GET 返回 404。sweep 只清理已公开且过期的包。

### Task 2: HTTP

`POST /artifacts` 接受 `publish: false`，响应有 `id`，没有 `url`。`POST /artifacts/:id/publish` 设置公开、写入 `expiresAt`，返回 `url`。

### Task 3: CLI

`artifacts create <path>` 调用未公开的 POST。`artifacts publish <id>` 调用公开接口。`artifacts publish <path>` 内部先 create 再 publish。`rm` 改名为 `delete`，两种状态都能删。
