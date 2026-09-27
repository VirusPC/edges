# 2026-09-26--Tailscale与Cloudflare安装审计-Win装cloudflared-Mac修CLI

> **今晚为何重要**：组网与 SSH 通了之后，还要能回答「每台到底装了没有、能不能敲命令」。00:01 的审计表第一次把四台局域网机器的 Tailscale / cloudflared 对齐；并当场补上 Windows 的 cloudflared、修好 Mac mini 卸 GUI 后 CLI 断裂——否则以后排障会陷入「节点在线但终端敲 tailscale 找不到」的假象。

【背景】
- 主审计：**2026-09-27 00:01:07–00:05:06 +08**。  
- 前置：Mac GUI→Homebrew 在 **20:47–21:05**（见「全网 Tailscale SSH」篇）。  
- 助手：IT资产管理。  
- 用户原文：「**各个主机的 tailscale 和 cloudflare 都安装好了么**」→「**好**」。

【过程】
1. **按主机核对（脱敏表）**

| 主机 | Tailscale | Cloudflare (cloudflared) |
|---|---|---|
| mini GTR（Ubuntu） | 已装、在线 | 已装，服务在跑 |
| NAS | 已装、在线 | 已装，`nas-tunnel` 在跑 |
| Mac mini | 已装且 `tailscaled` 在跑（短名 `macmini`）；**CLI 包装曾指向已卸 App** | 已装，隧道进程在跑 |
| Windows（`DESKTOP-K3G8QJ2`） | 已装、在线（后改名 `4070ts-win11`） | **未装 → 当晚装上** |

2. **Windows 安装 cloudflared**  
   - 用户对审计表回「好」后，助手当场补装。  
   - `winget` → **2026.9.3**，已在 PATH。  
   - **明确未做**：login / 开隧道（正确：凭证不进聊天；「在 PATH」≠「隧道已认证」）。

3. **Mac mini CLI 修复**  
   - **失败链**：为开 Tailscale SSH 必须卸沙盒 GUI 后，系统里残留坏 stub（如 `/usr/local/bin/tailscale` 仍指向已卸 App）；日常 shell 曾优先踩到坏路径 → 表现为「控制台绿点 / 节点在线，但终端敲 tailscale 失败或指错」。  
   - 修复后命令行可用（节点短名 `macmini` 在线）；**未乱动**正在跑的 `tailscaled`。  
   - 残留坏 stub 需管理员删除；删后 `hash -r`。验收 DoD：终端 `tailscale status` + 审计表双列勾选。

4. **与 SSH 篇衔接**  
   - CLI 断裂根因是为开 Tailscale SSH **必须卸沙盒 GUI**。  
   - 验收应含终端 `tailscale status`，不仅控制台绿点。

【所学】
- 用双列矩阵按主机逐行审计。  
- 卸 GUI 后 PATH stub 是高概率坑。  
- `cloudflared` 在 PATH ≠ 隧道已认证。  
- 「节点在线」与「本机 CLI 可用」是两件事，审计表要分列。

【行动指南】
- **主题行动指南**：组网与 SSH 通了之后，用「主机 × Tailscale × cloudflared」双列矩阵按机验收——命令行真能敲、服务真在跑，而不是只看控制台绿点。当晚补齐 Windows 的 cloudflared、修好 Mac 卸沙盒 GUI 后 CLI 指错路径；新主机入网时复制同一张表做 DoD。
- **前置条件**（没有就先做）：
  - 能登录各机终端，或经已通的 Tailscale SSH / 本机执行跑命令。
  - Mac：已完成 GUI→Homebrew（主题 02）；修 CLI 时**不要乱动**正在跑的 `tailscaled`。
  - Windows 装 cloudflared：本机有 winget；**login / 开隧道另议**（凭证与 tunnel token 不进聊天）。
  - 清理 Mac 坏 stub：需要该机管理员权限（残留路径曾见 `/usr/local/bin/tailscale`）。
- **触发与做法**：
  - 若 Win 要用 Cloudflare 隧道：前置——cloudflared 已在 PATH（当晚 winget 装上 **2026.9.3**，且明确未做 login）。则在本机补官方 login，密钥走安全卡片。
  - 若 Mac 仍命中坏 stub：前置——有管理员权限。则删除 `/usr/local/bin/tailscale` 后执行 `hash -r`，再确认 brew 版 `tailscale status` 可用。
  - 若新主机入网：前置——已明确要装 Mesh / 隧道客户端。则复制本审计表逐行勾选；验收必须含终端 `tailscale status`，不仅控制台绿点。

【补充说明】
- 敏感：账号 / tunnel token / Tailscale key **只记状态，不写值**。  
- 交叉：SSH →「全网 Tailscale SSH」篇；RDP →「Mac 遥控 Windows」篇；精确 Mesh 地址 → 本地 by-agent。
