# 2026-09-26--全网Tailscale-SSH开通与4070ts改名

> **今晚为何重要**：没有统一的 Tailscale SSH，助手就只能靠「人在屏幕前点 UAC / 塞公钥」。当晚把 minigtr、nas、aliyun-ecs、macmini 四台服务器侧 SSH 齐套，并给新 Windows 定下短名 `4070ts-win11`，等于把「远程代跑」从偶然变成可重复的运维通道。Mac mini 从沙盒 GUI 换成 brew daemon，是整晚最关键的一次安装通道纠正。

## 背景

- 时间：约 **20:07–21:05**（SSH 齐套）；**21:14+** 新 Windows 入网；**00:25–00:28** 改名定稿。
- 助手：IT资产管理为主；minigtr设备助手交办；4070ts-win11设备助手承接 Windows。
- 用户原文：「**所有服务器一块给我开了吧。让 @IT资产管理 去做下**」「**不要用往 authorized_keys 塞 Mac 公钥替代；要用 Tailscale SSH。**」（交办口径）「**改名4070ts-win11吧，之前的名字太长了**」→ 又改「**改名4070ts-win**」→ 最终「**4070ts-win11**」「**@gtx4070ts-win11设备助手 也改名**」。
- **公开库脱敏**：具体 Tailscale 私网地址 / 完整 MagicDNS 后缀见 by-agent；下文用短名与角色占位。

## 过程

### 台账对齐（约 20:07 起）

| 节点 | MagicDNS 短名 | 地址占位 | SSH 用户 | Tailscale SSH |
|---|---|---|---|---|
| mini GTR | `minigtr` | `〈TS:minigtr〉` | `viruspc` | ✅ 新开 |
| NAS | `nas` | `〈TS:nas〉`；LAN `〈LAN:nas〉` | `cheng` | ✅ |
| 阿里云 | `aliyun-ecs` | `〈TS:aliyun〉` | `cheng-dev` | ✅ 已有 |
| Mac mini | `macmini`（经 `macmini-1`） | `〈TS:macmini〉` | `chengpeng` | ✅ brew 后 |
| Windows | 长名→`4070ts-win`→**`4070ts-win11`** | `〈TS:4070ts〉`；本机名仍 `DESKTOP-K3G8QJ2` | `Cheng Peng` | ❌ Win 无服务端 |

### minigtr 开通（承接复电段）

- 用户本机 `sudo tailscale set --ssh`；首次代跑需浏览器点授权。
- 实测：`ssh viruspc@minigtr` 通 → 代跑恢复脚本。
- 历史结论：此前有普通 Tailscale + sshd，**没有**开过 Tailscale SSH。

### nas：失败到纠正（约 20:18–20:21）

- 初判：Tailscale 在 Docker，要 `docker exec … set --ssh`；临时经 minigtr 转发 NAS 管理页。
- BatchMode Permission denied——**不盲重试防 UGOS 锁 IP**。
- 用户：「**NAS是不是不应该在Docker里跑？**」「**minigtr和nas通过网线连着呢**」
- **实情**：UGOS 本机已有 **tailscale + tailscaled**；Docker compose 遗留且容器未跑。经网线以 `cheng` 执行 `sudo tailscale set --ssh`；`ssh cheng@nas.…` 通。临时密码文件已清。

### Mac mini：必须换安装通道（20:47–21:05）

- GUI 报错：`does not run in sandboxed Tailscale GUI builds`。
- 用户：「**确认一下，我必须要卸载GUI版本，对吗？**」→ 是。
- `brew install tailscale` → services start → `up` → `set --ssh`。新节点暂 `macmini-1`。
- 删旧节点：Auth key 不可用；改为 Access token（**不入库**）后删旧并改回 `macmini`。
- 验收：`ssh chengpeng@macmini` 自 minigtr 成功。

### Windows 与改名（21:14+；00:25–00:28）

- 官方：Tailscale SSH 服务端不支持 Windows；改走 OpenSSH / RDP。
- Tailscale 名：长名 → 试 `4070ts-win` → 定 **`4070ts-win11`**。本机名改需重启，未改。

## 所学

- 「服务器」口径要含常开的台式 Mac，不能只想 Linux / NAS。
- 磁盘上 Docker 与系统包可能并存；以**谁在跑**为准，不要凭 compose 文件下结论。
- 删除 Tailscale 节点要用 Access token，不是 Auth key。
- 短主机名要一次定稿，反复改名会拖累远控收藏与助手显示名。
- Windows 官方不提供 Tailscale SSH 服务端，不能拿 Linux 的开通步骤硬套。

## 行动指南

### 主题行动指南

#### 背景

多台常开机器已加入同一基于身份的组网，但远程代跑仍依赖人在屏幕前点授权或往公钥文件塞钥匙；其中可能还有沙盒图形客户端、以及不支持该远程登录服务端的系统。

#### 核心问题

如何把「偶发能登上去」变成可重复的远程代跑通道：各服务器侧统一打开基于身份的远程登录，并用邻机实测；遇到沙盒客户端或不支持的系统时，有明确替代路径，且节点短名一次定稿。

#### 核心解决方案

按顺序做：

1. 确认各机已入组网且节点可见；把「要当被连端」的机器列成清单（含常开 Mac）。
2. 在支持的服务器侧打开基于身份的远程登录开关，再用另一台已通节点实测登录。
3. 若图形客户端报沙盒、当不了被连端：卸掉沙盒版，改用系统级守护进程后再开远程登录。
4. 若系统官方不提供该远程登录服务端：改走本机命令行服务或屏幕远控，不要硬套同一开关。
5. 清理重复或暂名节点时，用管理端 Access token，不用入网 Auth key。
6. 节点显示名与助手名一次定稿为短名，避免远控收藏与对话 @ 漂移。

#### 验收标准

以后按本主题执行时，下列全部成立才算完成：

- 清单内每台「应被代跑」的服务器，已能从邻机经基于身份的远程登录实测通过（或已明确走替代远程方案）。
- Mac 若需被连，已使用非沙盒守护进程，终端可查组网状态。
- Windows 若需远程，已接受「无该远程登录服务端」并改走约定替代方案。
- 关键节点短名已定稿，助手显示名与之一致。

### 细节与其他

#### 若新 Linux 或 NAS 入网且要远程代跑

则：

1. 先确认已 `tailscale up`、节点在 `tailscale status` 可见。
2. 执行 `sudo tailscale set --ssh`。
3. 用另一台已通节点实测（minigtr=`viruspc`，nas=`cheng`，aliyun-ecs=`cheng-dev`，macmini=`chengpeng`）。

#### 若 Mac 要当 SSH 被连端

则：

- 若仍是沙盒 GUI，会报 sandboxed、当不了被连端——须卸 GUI。
- 然后：`brew install tailscale` → services start → `up` → `set --ssh`。
- 若出现暂名 `macmini-1`：用 Access token（不是 Auth key）删旧节点并改回 `macmini`。
- 验收：自 minigtr `ssh chengpeng@macmini` 成功。

#### 若 NAS 开 SSH 遭 Permission denied

则：

- BatchMode 下**不要盲重试**（防 UGOS 锁 IP）。
- 先辨「谁在跑」：UGOS 系统包 tailscale/tailscaled 优先于磁盘上遗留的 Docker compose。
- 经网线用用户 `cheng` 执行 `set --ssh`，再测 `ssh cheng@nas…`。

#### 若 Windows 要远程命令行

则：不要指望 `tailscale set --ssh`；改装/开 OpenSSH Server，或走屏幕远控（见主题 06）。

#### 若改短名

则：先改 MagicDNS，定稿 **`4070ts-win11`**（曾试 `4070ts-win`），再同步设备助手显示名；本机名 `DESKTOP-K3G8QJ2` 另排重启。

## 补充说明

- 凭证只记「已用安全卡片 / 已清临时文件」，不写值。
- 精确地址 / machineId → `by-agent/IT资产管理.md`。
- 交叉：复电与代跑入口 → 主题 01；有线局域网 → 主题 03；cloudflared / CLI 审计 → 主题 05；RDP → 主题 06。
- 来源对话：IT资产管理为主，minigtr设备助手交办，约 20:07–21:05 与 00:25–00:28 段。
