# 2026-09-27--Kev经Cloudflare-Tunnel与Access公网暴露

> 把本机 Kev（FastAPI，仅监听 `127.0.0.1:8009`）用 Cloudflare Tunnel 挂到固定子域名，再用 Access 做浏览器邮箱登录与 curl Service Token 两套门禁；中间踩过「Allow 策略里塞 Service Token 无效」的坑。

## 背景

本机已跑通 Kev-4B（CUDA），本地只能 `127.0.0.1:8009` 访问。目标是公网固定域名可调，同时不能裸奔：浏览器走身份登录，脚本走机器凭证。域名与允许邮箱等事实来自 IT 资产管理侧既有约定（区 `viruspc.tech`、主机名优先 `kev.viruspc.tech`）。

相关前置：Windows 上 uv/torch 装成 CPU 轮子再改回 CUDA 的踩坑，见同日笔记 [Windows-uv-安装Kev-踩到CPU版torch](./2026-09-27--Windows-uv-安装Kev-踩到CPU版torch.md)。

## 过程

### 时刻不详 · 选定暴露与鉴权方案

讨论 DIY 反代 vs Cloudflare。结论：连通用 **Tunnel**，鉴权用 **Zero Trust Access**（浏览器邮箱 + 脚本 Service Token），二者解耦，用主机名拼在一起。

### 时刻不详 · 新建命名隧道并挂 DNS

在已登录 Cloudflare 的环境创建命名隧道（本机侧隧道名与 Windows 主机对应），为 `kev.viruspc.tech` 建 CNAME 指到该隧道；ingress 指向 `http://127.0.0.1:8009`。Windows 用 winget 安装 `cloudflared`；因用户主目录路径含空格，配置与凭证改放到无空格目录（如 `C:\cloudflared\`）。以用户进程跑通隧道；尝试装成 Windows 服务因权限不足未完成。

### 时刻不详 · 公网连通验证（尚无 Access）

未开 Access 时，公网 `GET /v1/models` 已返回 `device:cuda`。同时澄清 API 用法：OpenAPI 在 `/openapi.json`；`/v1/systemone` 不是 chat `messages` 形状，需要 `state` 与按题型组织的 `questions` 对象。

### 时刻不详 · 创建 Access 自托管应用

Zero Trust 里 Applications 为空（首次用 Access）。新建自托管应用，域名 `kev.viruspc.tech`，路径 `/*`。团队登录主机形如 `*.cloudflareaccess.com`。允许邮箱写入 Allow 策略。

### 时刻不详 · Service Token 与「一直 302」排查

为 curl 创建 Service Token，起初把「邮箱 Allow」与「Service Token」写进**同一条 Action = Allow** 的策略。结果：浏览器可登录，curl 带 `CF-Access-Client-Id` / `CF-Access-Client-Secret` 仍 **302**，日志侧可见 `service_token_status:false` 一类表现。

根因：Service Token 必须挂在 **Action = Service Auth** 的独立策略上，不能塞进普通 Allow。修正后策略为两条：

- `allow-kev` — Allow — 邮箱
- `service-auth-kev` — Service Auth — Service Token

凭证只落本地 env 文件（权限收紧），不进 git、不贴聊天。Mac 侧用 `source` 后带头请求验证：无凭证 302，有凭证 200 且仍为 `device:cuda`。

### 约 17:43 · 浏览器登录后根路径 Not Found

用户浏览器完成 Access 登录后看到 `{"detail":"Not Found"}`。确认为 Kev/FastAPI **根路径 `/` 无路由**的正常 404，与门禁无关。改开 `/docs`、`/openapi.json`、`/v1/models` 后确认全通。

## 所学

- **Tunnel 只负责连通，Access 只负责谁能进**：改 Access 策略不会动隧道 ingress；关 Access 应用也不会拆掉公网 DNS。
- **Access 里邮箱 ≠「知道邮箱字符串」**：浏览器侧是 IdP 证明登录；脚本侧是 Service Token 请求头，两套通道二选一即可，不必同时带。
- **Service Token 策略动作必须是 Service Auth**：与 Allow 混写时，常见现象是浏览器正常、机器凭证永远被重定向到登录页。
- **上游应用的 404 会被 Access 原样透出**：门禁通过后看到的 JSON/HTML 错误来自源站，不要先怀疑 Access「坏了」。

## 行动指南

### 主题行动指南

#### 背景

要把「只听本机回环」的 HTTP 服务挂到固定公网主机名，并区分人用浏览器与机器用脚本。

#### 核心问题

如何同时做到：固定 HTTPS 域名、源站不必开公网端口、浏览器可登录、脚本可无交互鉴权，且两类凭证互不踩坑。

#### 核心解决方案

1. 用 Cloudflare 命名隧道把公网主机名 ingress 到本机 `127.0.0.1:端口`；DNS CNAME 指到该隧道。
2. 在 Zero Trust 为该主机名建自托管 Access 应用（覆盖需要保护的路径，通常 `/*`）。
3. 建一条 **Allow** 策略：仅允许约定身份（如邮箱列表 / IdP 组）。
4. 另建一条 **Service Auth** 策略：只挂 Service Token（不要和 Allow 写在同一条里）。
5. 浏览器：直接打开 HTTPS 主机名，完成 Access 登录后再访问上游路径。
6. 脚本：在请求中带 `CF-Access-Client-Id` 与 `CF-Access-Client-Secret`（从本机 env 文件注入，勿提交仓库）。
7. 验收时分别测：无凭证应被拦；浏览器登录后可访问真实上游路由；带 Token 的 curl 返回业务 JSON。

#### 验收标准

- 无 Cookie、无 Service Token 访问受保护主机名时被重定向或拒绝（非业务 200）。
- 浏览器完成 Access 登录后，上游真实存在的路径（如 `/docs`、业务 API）可打开。
- 仅带正确 Service Token 头的请求对业务路径返回成功响应；错误或缺失 Token 失败。
- 上游根路径若无页面，出现框架默认 404 可接受，不视为 Access 失败。
- 凭证文件不在 git 中；公开笔记不含 Token 明文。

### 细节与其他

#### 若 Windows 用户主目录路径含空格

则：不要把 `cloudflared` 配置/凭证默认放在 `%USERPROFILE%\.cloudflared\`；改用无空格目录（例如 `C:\cloudflared\`），并在运行参数里显式指向该 config。

#### 若要把隧道装成开机服务但「Access denied」

则：需要提升权限的管理员安装；用户进程跑通只保证当前登录会话。睡眠/关机仍会让公网端点下线，与 Access 无关。

#### 若 curl 带了 Service Token 仍 302 到 `*.cloudflareaccess.com`

则：先检查 Access 应用里是否存在 **独立的 Service Auth** 策略且 Token 已勾选；不要只改 Allow 策略里的 Include。改完后保存应用再测。

#### 若浏览器登录成功却只看到 `{"detail":"Not Found"}`

则：先试 `/docs`、`/openapi.json` 或明确的 API 路径。FastAPI 默认根路径无路由时就会返回该 JSON。

#### 若在 Mac 上用 env 文件调 Kev

则：示例形状（路径按本机放置；变量名与 Cloudflare 文档一致）：

```bash
set -a; source ~/agent-tools/kev-access-service-token.env; set +a

curl -sS https://kev.viruspc.tech/v1/models \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET"
```

#### 若调用 `/v1/systemone`

则：按 OpenAPI/`/docs` 使用 `state` + `questions`（按题型为对象），不要套成通用 chat `messages`。

## 补充说明

- 公网主机名：`https://kev.viruspc.tech`（源站本机 `127.0.0.1:8009`）。
- Access 应用名示例：`kev`；策略名示例：`allow-kev`、`service-auth-kev`。
- 同日相关：[2026-09-27--Windows-uv-安装Kev-踩到CPU版torch.md](./2026-09-27--Windows-uv-安装Kev-踩到CPU版torch.md) — CUDA/torch 安装与 `--no-sync` 起服。
- 可选后续（对话中未做完）：管理员权限把 `cloudflared` 装成 Windows 服务；旧 Service Token 轮换清理；把 Access 约定同步给 IT 资产管理。
- 本文已脱敏：不含 Service Token 明文、不含内网 Tailscale 地址。
