# 2026-09-26--全网Tailscale-SSH开通与4070ts改名

> **今晚为何重要**：没有统一的 Tailscale SSH，助手就只能靠「人在屏幕前点 UAC / 塞公钥」。当晚把 minigtr、nas、aliyun-ecs、macmini 四台服务器侧 SSH 齐套，并给新 Windows 定下短名 `4070ts-win11`，等于把「远程代跑」从偶然变成可重复的运维通道。Mac mini 从沙盒 GUI 换成 brew daemon，是整晚最关键的一次安装通道纠正。

【背景】
- 时间：约 **20:07–21:05**（SSH 齐套）；**21:14+** 新 Windows 入网；**00:25–00:28** 改名定稿。  
- 助手：IT资产管理为主；minigtr设备助手交办；4070ts-win11设备助手承接 Windows。  
- 用户原文：「**所有服务器一块给我开了吧。让 @IT资产管理 去做下**」「**不要用往 authorized_keys 塞 Mac 公钥替代；要用 Tailscale SSH。**」「**改名4070ts-win11吧，之前的名字太长了**」→ 又改「**改名4070ts-win**」→ 最终「**4070ts-win11**」「**@gtx4070ts-win11设备助手 也改名**」。  
- **公开库脱敏**：具体 Mesh 私网地址 / 完整 MagicDNS 后缀 / 密钥字面量见本地 by-agent；下文只用短名与角色描述。

【过程】
### 台账（当晚，脱敏）
| 节点 | MagicDNS 短名 | 地址写法 | SSH 用户 | Tailscale SSH |
|---|---|---|---|---|
| mini GTR | `minigtr` | Mesh 上的 minigtr | `viruspc` | ✅ 新开 |
| NAS | `nas` | Mesh 上的 nas；家庭 LAN 上的 NAS | `cheng` | ✅ |
| 阿里云 | `aliyun-ecs` | Mesh 上的 aliyun-ecs | `cheng-dev` | ✅ 已有 |
| Mac mini | `macmini`（经短暂 `macmini-1`） | Mesh 上的 macmini | `chengpeng` | ✅ brew 后 |
| Windows | 长名→`4070ts-win`→**`4070ts-win11`** | Mesh 上的 4070ts；本机名仍 `DESKTOP-K3G8QJ2` | `Cheng Peng` | ❌ Win 无服务端 |

### minigtr
- 用户本机 `sudo tailscale set --ssh`；首次代跑需浏览器点授权。  
- 实测：`ssh viruspc@minigtr` 通 → 代跑恢复脚本。  
- 历史结论：此前有普通 Tailscale + sshd，**没有**开过 Tailscale SSH。  
- **失败链**：开开关前从 Mac 普通 SSH 为 Permission denied；开后才成为整晚代跑主通道。

### nas（失败→纠正）
- 初判：Tailscale 在 Docker，要 `docker exec … set --ssh`；临时经 minigtr 转发 NAS 管理页。  
- BatchMode Permission denied——**不盲重试防 UGOS 锁 IP**。  
- 用户：「**NAS是不是不应该在Docker里跑？**」「**minigtr和nas通过网线连着呢**」  
- **实情**：UGOS 本机已有 **tailscale + tailscaled**；Docker compose 遗留且容器未跑。经网线以 `cheng` 执行 `sudo tailscale set --ssh`；`ssh cheng@nas`（MagicDNS）通。临时密码文件已清。  
- **公开可写教训**：磁盘上「有 Docker 痕迹」≠「当前跑的是容器」；以进程/服务谁在跑为准。

### Mac mini（必须换通道）
- GUI 报错原文级要点：`does not run in sandboxed Tailscale GUI builds`。  
- 用户：「**确认一下，我必须要卸载GUI版本，对吗？**」→ 是。  
- `brew install tailscale` → services start → `up` → `set --ssh`。新节点暂名 `macmini-1`（旧 `macmini` 仍在）。  
- 删旧节点：用户先给的是设备入网用的 **Auth key**，删节点要的是 **API Access token**（**不入库、不写厂商 key 前缀**）；换成 Access token 后删旧并改回短名 `macmini`。  
- 验收：`ssh chengpeng@macmini` 自 minigtr 成功。  
- **失败链**：GUI 与 Homebrew `tailscaled` 不能双活（抢 DNS/控制面）；必须先卸沙盒 GUI / 系统扩展再登录开源守护进程。

### Windows 与改名
- 官方：Tailscale SSH 服务端不支持 Windows；改走 OpenSSH / RDP。  
- 新机入网时 MagicDNS 曾用很长的 `i7-gtx4070ts-win11`；初测经 DERP、延迟很高（未直连）。  
- 00:25–00:28 Tailscale 名：长名 → 试 `4070ts-win` → 定 **`4070ts-win11`**。本机名改需重启，当晚未改。

【所学】
- 服务器口径要含「常开的 Mac」。  
- Docker 与系统包可能并存于磁盘；以**谁在跑**为准。  
- 删 Tailscale 节点要 Access token，不是 Auth key。  
- 短主机名要一次定稿，远控收藏夹才不会反复改。  
- 「网通 / ping 通」≠「身份免密壳」；Permission denied 时先查 sshHostKeys，勿盲重试（尤其 NAS/UGOS）。

【行动指南】
- 新 Linux/NAS：`sudo tailscale set --ssh`，再实测 `ssh user@短名`。  
- Mac 当 SSH 被连端：非 App Store 沙盒 GUI，用 brew / `tailscaled`。  
- Windows 要远程壳：OpenSSH Server，不要指望 `tailscale set --ssh`。  
- 改名：先 MagicDNS，再同步设备助手显示名；本机名另排重启。

【补充说明】
- 凭证只记「已用安全卡片 / 已清临时文件」，不写值。  
- 精确 Mesh 地址 / machineId → 本地 `by-agent/IT资产管理.md`（不进公开库）。  
- 交叉：LAN →「交换机重建局域网」篇；cloudflared/CLI →「安装审计」篇；RDP →「Mac 遥控 Windows」篇。
