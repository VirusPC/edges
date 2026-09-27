# 2026-09-27--Kev经Cloudflare-Tunnel与Access公网暴露

> 本机 Kev（FastAPI，仅 `127.0.0.1:8009`）挂到固定子域名，并用 Cloudflare Access 做浏览器邮箱登录与 curl Service Token；中间踩过「Allow 策略里塞 Service Token 无效」。

## 背景

本机已跑通 Kev-4B（CUDA），只能本机回环访问。意图是公网固定域名可调，同时不能裸奔：人用浏览器登录，脚本用机器凭证。域名与允许邮箱等事实来自 IT 资产管理侧既有约定（区 `viruspc.tech`、主机名优先 `kev.viruspc.tech`）。

相关前置：Windows 上 uv/torch 装成 CPU 轮子再改回 CUDA，见 [Windows-uv-安装Kev-踩到CPU版torch](./2026-09-27--Windows-uv-安装Kev-踩到CPU版torch.md)。

## 主题

把只听本机回环的 Kev HTTP 服务，用 Cloudflare Tunnel 挂到 `kev.viruspc.tech`，再用 Zero Trust Access 分开做人机鉴权，并弄清 API 形态与根路径 404。

- 难点一：Tunnel（连通）与 Access（门禁）容易混成一件事，改错层会白排查。
- 难点二：Service Token 若写进 Action=Allow 的策略，curl 会一直 302，看起来像「Token 坏了」。
- 难点三：Windows 用户主目录路径含空格时，`cloudflared` 默认配置路径易踩坑；装成服务还要管理员权限。
- 难点四：Access 登录成功后根路径 `{"detail":"Not Found"}` 容易被误判为门禁失败，其实是 FastAPI 无 `/` 路由。

## 过程

### 时刻不详 · 选定暴露与鉴权方案

讨论 DIY 反代 vs Cloudflare。可选项里明确比过自建反代；最终选 Cloudflare：**Tunnel 只做连通，Access 做鉴权**（浏览器邮箱 + 脚本 Service Token），二者解耦，用主机名拼在一起。不做 DIY，是因为域名与 Zero Trust 已在既有体系里，少维护一层自建网关。

### 时刻不详 · 新建命名隧道并挂 DNS

在已登录 Cloudflare 的环境创建命名隧道（本机侧隧道名与 Windows 主机对应），为 `kev.viruspc.tech` 建 CNAME 指到该隧道；ingress 指向 `http://127.0.0.1:8009`。Windows 用 winget 安装 `cloudflared`。因用户主目录路径含空格，配置与凭证改放到无空格目录（如 `C:\cloudflared\`），而不是默认 `%USERPROFILE%\.cloudflared\`。以用户进程跑通隧道；尝试装成 Windows 服务因权限不足未完成（未强行提权）。

### 时刻不详 · 公网连通验证（尚无 Access）

未开 Access 时，公网 `GET /v1/models` 已返回 `device:cuda`。同时澄清 API：OpenAPI 在 `/openapi.json`；`/v1/systemone` 不是 chat `messages` 形状，需要 `state` 与按题型组织的 `questions` 对象。

### 时刻不详 · 创建 Access 自托管应用

Zero Trust 里 Applications 为空（首次用 Access）。新建自托管应用，域名 `kev.viruspc.tech`，路径 `/*`。团队登录主机形如 `*.cloudflareaccess.com`。允许邮箱写入 Allow 策略。

### 时刻不详 · Service Token 与「一直 302」排查

为 curl 创建 Service Token。起初把「邮箱 Allow」与「Service Token」写进**同一条 Action = Allow** 的策略。结果：浏览器可登录，curl 带 `CF-Access-Client-Id` / `CF-Access-Client-Secret` 仍 **302**，侧写可见 `service_token_status:false` 一类表现。

根因与修正：Service Token 必须挂在 **Action = Service Auth** 的独立策略上，不能塞进普通 Allow。修正后为两条：

- `allow-kev` — Allow — 邮箱
- `service-auth-kev` — Service Auth — Service Token

凭证只落本地 env 文件（权限收紧），不进 git、不贴聊天。Mac 侧 `source` 后带头请求：无凭证 302，有凭证 200 且仍为 `device:cuda`。

### 约 17:43 · 浏览器登录后根路径 Not Found

用户浏览器完成 Access 登录后看到 `{"detail":"Not Found"}`。核对为 Kev/FastAPI **根路径 `/` 无路由**的正常 404，与门禁无关。改开 `/docs`、`/openapi.json`、`/v1/models` 后确认全通。

### 约 17:44–17:51 · 笔记结构与 skill 版本对齐

用户要求总结笔记；初稿按 bot 侧仍停在 2.2.0 的旧骨架（背景直接接过程）写入并开 PR #145。用户指出结构偏旧、记得有「主题」；核对后确认 edges 已在 2026-09-26～27 推到 2.3.x（`背景 → 主题 → 过程 → 结果 → …`），bot workflow 未同步。随后确认：同步 skill 到 2.3.3，并按新结构重写本篇。

## 结果

- 已做成：`https://kev.viruspc.tech` 经 Tunnel 到本机 8009；Access 门禁有效（裸请求 302）；浏览器邮箱登录后可开 `/docs` 等；Mac curl 带 Service Token 得 200 / `device:cuda`。
- 未闭环：`cloudflared` 未装成 Windows 服务（需管理员）；睡眠/关机仍会使公网端点下线；旧 Service Token 轮换清理可选；Access 约定可同步给 IT 资产管理。
- 无回退：未改回 DIY 反代；未关掉 Access。

## 所学

- Tunnel 与 Access 解耦：连通层和门禁层分开改、分开验。
- 可选项上：相对 DIY 反代，选 Cloudflare 是因为域名/Zero Trust 已在体系内，少维护自建网关；不是「Cloudflare 永远更好」。
- Service Token 必须走 **Service Auth** 策略；写进 Allow 时常见「浏览器正常、脚本永远 302」。
- Access 放行后的业务 404 来自源站（如 FastAPI 无 `/`），不要先怀疑门禁坏了。
- bot 本地 skill 可能落后于 edges 权威版本；整理前应以 `extensions/skills/conversation-to-notes` 为准。

## 行动指南

### 主题行动指南

#### 背景

要把「只听本机回环」的 HTTP 服务挂到固定公网主机名，并区分人用浏览器与机器用脚本。

#### 核心问题

如何同时做到：固定 HTTPS 域名、源站不必开公网端口、浏览器可登录、脚本可无交互鉴权，且两类凭证互不踩坑。

#### 核心解决方案

1. 用 Cloudflare 命名隧道把公网主机名 ingress 到本机 `127.0.0.1:端口`；DNS CNAME 指到该隧道。  
   （相关可选项：DIY 反代 / 自建网关。本次不做：要多维护一层，且域名与 Zero Trust 已在 Cloudflare 体系。）
2. 在 Zero Trust 为该主机名建自托管 Access 应用（通常覆盖 `/*`）。
3. 建一条 **Allow** 策略：仅允许约定身份（邮箱 / IdP 组）。
4. 另建一条 **Service Auth** 策略：只挂 Service Token（不要和 Allow 写在同一条）。  
   （相关可选项：把 Token 塞进 Allow。不做：机器凭证不会按 Service Token 路径生效，curl 易一直 302。）
5. 浏览器：打开 HTTPS 主机名，完成 Access 登录后再访问上游真实路径。
6. 脚本：请求带 `CF-Access-Client-Id` 与 `CF-Access-Client-Secret`（本机 env 注入，勿提交仓库）。
7. 分别验收：无凭证应被拦；浏览器登录后可访问真实上游路由；带 Token 的 curl 返回业务 JSON。

#### 验收标准

- 无 Cookie、无 Service Token 访问受保护主机名时被重定向或拒绝（非业务 200）
- 浏览器完成 Access 登录后，上游真实存在的路径（如 `/docs`、业务 API）可打开
- 仅带正确 Service Token 头的请求对业务路径返回成功；错误或缺失 Token 失败
- 上游根路径若无页面，框架默认 404 可接受，不视为 Access 失败
- 凭证文件不在 git；公开笔记不含 Token 明文

### 细节与其他

#### 若 Windows 用户主目录路径含空格

则：不要把 `cloudflared` 配置/凭证默认放在 `%USERPROFILE%\.cloudflared\`；改用无空格目录（例如 `C:\cloudflared\`），并在运行参数里显式指向该 config。

#### 若要把隧道装成开机服务但「Access denied」

则：需要提升权限的管理员安装；用户进程跑通只保证当前登录会话。睡眠/关机仍会让公网端点下线，与 Access 无关。相关可选项：继续用户进程。可接受作临时方案，但重启/注销后要记得再拉起。

#### 若 curl 带了 Service Token 仍 302 到 `*.cloudflareaccess.com`

则：先检查是否存在**独立的 Service Auth** 策略且 Token 已勾选；不要只改 Allow 的 Include。改完后保存应用再测。

#### 若浏览器登录成功却只看到 `{"detail":"Not Found"}`

则：先试 `/docs`、`/openapi.json` 或明确 API 路径。FastAPI 默认根路径无路由时就会返回该 JSON。

#### 若在 Mac 上用 env 文件调 Kev

则：

```bash
set -a; source ~/agent-tools/kev-access-service-token.env; set +a

curl -sS https://kev.viruspc.tech/v1/models \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET"
```

（路径按本机放置；勿把该文件提交仓库。）

#### 若调用 `/v1/systemone`

则：按 OpenAPI/`/docs` 使用 `state` + `questions`（按题型为对象），不要套成通用 chat `messages`。

#### 若 bot 本地 conversation-to-notes 与 edges 不一致

则：以 `VirusPC/edges` 的 `extensions/skills/conversation-to-notes`（当前 2.3.3）为准同步本地 workflow，再整理笔记。

## 补充说明

- 原始材料：Grok Bot「通用-辅助-2」本会话（2026-09-27，约公网暴露与 Access 配置时段）；同日相关笔记与 PR #144（torch/CUDA）、本篇 PR #145；edges skill 权威路径 `extensions/skills/conversation-to-notes`（2.3.3）。
- 公网主机名：`https://kev.viruspc.tech`（源站本机 `127.0.0.1:8009`）。
- Access 应用名示例：`kev`；策略名示例：`allow-kev`、`service-auth-kev`。
- 同日相关：[2026-09-27--Windows-uv-安装Kev-踩到CPU版torch.md](./2026-09-27--Windows-uv-安装Kev-踩到CPU版torch.md) — CUDA/torch 与 `--no-sync` 起服。
- 可选后续（未做完）：管理员安装 `cloudflared` 服务；旧 Token 清理；Access 约定同步 IT 资产管理。
- 本文已脱敏：不含 Service Token 明文、不含内网 Tailscale 地址。
