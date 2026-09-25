# Grok Bot / Artifacts 预览与交接 loop

## 1. Artifacts 裸 IP 预览：box 浏览器打不开

### 事实（Facts）

- 已改域名：Artifacts 的 `BASE_URL` 改为 `https://edges.viruspc.tech`。下面的裸 IP 是当时现象记录，不是当前入口。
- 现象：`http://182.92.131.89/artifacts/<id>/` 直连 `curl` 返回 200；但 box Chromium，或经 `127.0.0.1:8791` 出口代理访问时，返回 HTTP 400、空 body，Chrome 显示「HTTP ERROR 400」。
- 证据场景：Tasks 审阅壳 #133 验收；视觉同学在本机 `127.0.0.1:8766` 真滚页面。

### 判断与处理

- 原因是 Grok Bot box 的 Cloudflare privacy egress 会拦截裸 IP 的 HTTP 请求，并非 artifacts / nginx 针对 UA 或 cookie 的策略。
- Workaround：用 `curl` 下载同一份 HTML，再在本机 `127.0.0.1` 起服务；或者直接使用各 agent 共享的 `/workspace/cloud-agent-artifacts/...html`。
- 已改域名：Artifacts 的 `BASE_URL` 改为 `https://edges.viruspc.tech`。

## 2. 中途步骤被打断 + 用户不回复：整条 loop 中断

### 场景（Facts）

Coding 专家修完 #133 的 ④ 后启动后台 `artifacts publish`，原计划把预览交给视觉同学复验。该步骤被中断，挂了数小时并标记为 user interrupt；随后既没有发出 URL，也没有继续说明，直到用户问「怎么不说话了」。

### 教训（Insights）

- `publish → SendToAgent（设计验收）→ SendToUser 告知` 应放在同一条交接链里，尽快闭环。
- 被打断时要主动报告 blocker 和当前状态，不能默默等待用户来戳；即使预览 URL 尚未拿到，也应先说明中断点、影响和下一步。
- 预览可达性与交接可见性是两件事：前者解决视觉同学能否打开，后者解决 loop 是否真正完成。

## 行动（Actions）

- 短期：Artifacts 发布后立即验证 URL / 本地替代路径，并在同一轮交接中通知设计验收方和用户。
- 若发布或发送步骤失败：明确报告 blocker，不把后台挂起当作已完成。
- 中期：为 Artifacts 提供代理可放行的域名，减少裸 IP 预览分支。

## 相关

- 早期笔记已记录 Artifacts 临时预览 URL 及在线预览体验：[2026-09-24--Grok-Bot手机模拟器与在线预览体验](./2026-09-24--Grok-Bot手机模拟器与在线预览体验.md)
