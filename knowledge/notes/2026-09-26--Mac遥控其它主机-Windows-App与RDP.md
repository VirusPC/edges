# 2026-09-26--Mac遥控其它主机-Windows-App与RDP

> **今晚为何重要**：有线局域网 + Tailscale 解决了「包能到」，但用户真正要的是 **从 MacBook 看到别人的屏幕**。当晚澄清：Mac↔Mac 用屏幕共享；Mac↔Windows 用 **Windows App（原 Microsoft Remote Desktop）+ 本机开 RDP**；并启用了 `4070ts-win11` 的远程桌面。账号怎么填、主机名用短名还是 IP，都直接决定明天能不能连上。

【背景】
- 方案讨论 **00:08**；专业版与 Windows App **00:21–00:25**；开 RDP **00:25**；登录字段 **00:30**。  
- 助手：IT资产管理。  
- 用户原文：「**我的macbook如何操控其他主机的屏幕？macmini是可以的，tailscale+screen sharing。其他的怎么办？**」「**我这个win是专业版？**」「**好像用 windowsAPP 连接就行？**」「**我打开了么**」「**我windowsapp远程登陆 4070ts，账号密码填啥**」。

【过程】
1. **分系统协议（00:08）**  
   - Mac mini：屏幕共享 / `vnc://macmini`。  
   - Windows：开「远程桌面」；Mac 用 **Windows App** 连 MagicDNS 短名（或 Mesh 上的 4070ts，公开稿优先短名）。  
   - Ubuntu：GNOME Remote Desktop / xrdp / VNC（当晚未强制落地）。  
   - NAS：优先网页管理。  
   - 统一：走 Tailscale / Mesh，不公网裸奔。

2. **确认专业版 + Windows App（00:21–00:24）**  
   - Windows 11 **Pro for Workstations**（23H2）→ 可用完整 RDP 主机功能。  
   - 「好像用 windowsAPP 连接就行？」→ 对。

3. **启用远程桌面（00:25）**  
   - 用户问「我打开了么」→ 助手代查并打开：远程桌面允许连接（注册表级 `fDenyTSConnections=0`），相关服务在跑。  
   - 连接目标应用短名 **`4070ts-win11`**（见 SSH/改名篇）；公开收藏夹优先短名，不塞 Mesh 私网数字地址。  
   - **失败链提醒**：家用版 Win 有时没有完整 RDP 主机功能；当晚确认为 Pro for Workstations 才走 Windows App 正路，否则才考虑第三方远控（仍建议经 Mesh）。

4. **账号字段（00:30）**  
   - 主机：`4070ts-win11`（优先 MagicDNS 短名）  
   - 用户：`Cheng Peng`；备选 `DESKTOP-K3G8QJ2\Cheng Peng` / `.\Cheng Peng`  
   - 密码：本机账户密码（PIN 通常不能直接当 RDP 密码）。**助手未存解锁密码。**

5. **相关：关自动锁屏（00:32–00:36，4070ts 助手侧）**  
   - 目的：远控/本机执行时少被锁屏打断。

【所学】
- 「能 SSH」≠「能看屏幕」。  
- Windows App 连的是 RDP，依赖专业版 + 防火墙 + 账户密码。  
- 短 MagicDNS 名对远控收藏极其重要；公开收藏夹不要塞 Mesh 私网数字地址。

【行动指南】
- 连不上：查 RDP 是否启用、Tailscale 是否在线、用户名是否带电脑名前缀、是否用账户密码而非 PIN。  
- 只要命令行：OpenSSH 或 Grok Bot 本机执行。  
- 控 Ubuntu 桌面：另开专题，仍走 Tailscale。

【补充说明】
- 精确 Mesh 地址 → 本地 by-agent。交叉：改名 → SSH 篇；关锁屏 / Wi‑Fi → 支线篇。
