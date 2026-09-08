---
name: project_progress
title: 订阅管理盘点进展
description: 订阅/用量盘点进展：双 Gmail + QQ IMAP、国内 Kimi 无邮箱、CodexBar Linux CLI 已装待鉴权；后续 Apple/微信侧核对。
type: project
originSessionId: e64a78c8-9de9-4933-a7b5-4d162cb7aea4
agentClient: 订阅管理
updatedAt: "2026-09-08T09:47:44+00:00"
---

订阅管理助手已建立「邮件收据 + 支付侧核对 + 用量 CLI」的混合盘点路径；国内微信系产品（如 Kimi）不能靠邮箱扫箱。

**Why:**
- ChatGPT / Claude / Cursor / Grok / Kimi 等没有统一的官方订阅 MCP；邮件收据是跨厂商的第一抓手，但国内微信登录产品往往不发邮件、甚至不提供邮箱绑定。
- 用量（如 Codex 限额）与账单是两套数据：账单看收据/自动续费，用量看 CodexBar 一类工具。

**How to apply:**
1. **邮箱（账单）**
   - 两套 Gmail 已用 Grok Bot Gmail 连接器接入（主箱 + viruspc 箱）；QQ 邮箱用本机 Himalaya CLI + IMAP（`imap.qq.com`），授权码仅存环境变量名 `QQ_MAIL_AUTH_CODE`，不明文入库。
   - 邮箱资产台账已交给 IT资产管理记录（只记地址与接入方式，不记密钥）。
2. **国内 Kimi（微信登录国内号）**
   - 账号绑定页只有手机号 + 微信，**无邮箱**；会员状态看 App「设置 → 订阅管理」或微信钱包自动续费/账单（搜「月之暗面」）。
   - Gmail 里曾出现的 Moonshot Stripe `$19` 收据视为国际站路径，可能与国内微信账号分离。
3. **用量（非金额）**
   - CodexBar CLI 已在 Linux 验证可安装运行（`v0.56.8` → `~/.local/bin/codexbar`）。
   - 当前环境缺 Codex 登录态（无 `codex` CLI / `~/.codex/auth.json`），故 `codexbar --provider codex` 报 `No available fetch strategy`；下一步需本机 `codex auth login` 或在已登录机器上跑。
4. **仍待核对**
   - Apple 订阅页（ChatGPT / Claude 走 Apple ID）：无正式连接器，需浏览器登录核对。
   - Cursor：用户说明由 SuperGrok Heavy 附带，非单独付费。
   - 智谱清言 / GLM 等国内号：优先产品内会员页 + 微信/支付宝自动扣费，勿默认邮箱。

**当前状态（用户陈述 / 已验证混合）：** 基础设施（Gmail×2、QQ IMAP、CodexBar CLI）已就绪；国内 Kimi 路径已澄清；用量查询卡在 Codex 鉴权。
