# 2026-09-26--minigtr断电恢复-UPS选型-默认Ubuntu开机

> **今晚为何重要**：这是整晚的起点。minigtr 一断电，NAS 直连、Tailscale 入口、后续交换机网关全部失去远程抓手。当晚把「掉线→进 Ubuntu→开 Tailscale SSH→跑恢复脚本→默认 Ubuntu 启动」跑通，等于给家里常开枢纽装上了复电能力；后面 LAN / SMB / 远程桌面都建立在这件事之上。

【背景】
- 时间：2026-09-26 **19:43:14 +08** 起（至约 20:16 恢复脚本代跑完成）。
- 助手：minigtr设备助手。
- 主机：minigtr，用户 `viruspc`；Ubuntu 主用 + Win11 双系统（同一块 YMTC PC41Q-1TB-B NVMe）。
- 触发用户原文：「**我的minigtr是不是掉线了**」→「**电源断了下，刚重新开机，我怎么恢复**」→「**我需要某种不间断电源。**」→「**断电还能撑半个小时。**」→「**而且我觉得我每个主机都需要准备好一键恢复脚本。**」→「**我希望默认ubuntu**」。

【过程】
1. **掉线确认（19:43）**  
   助手结论要点：Grok Bot 本地执行未连接；从 Mac mini ping Mesh 上的 minigtr 全丢包，SSH 超时；「不像是只挂了助手，更像整机不在网」。Mac mini 当时在线。

2. **人工开机后的恢复口径（19:44）**  
   - 进 Ubuntu：若直接进 Win11，重启按 **F11** 选 `ubuntu`（固件常优先 Windows）；**Del** 进 Setup。  
   - 登录 `viruspc`，确认能上网；企业 Wi‑Fi 用 PEAP+MSCHAPv2（档案硬规则，见支线篇）。  
   - `tailscale status`；必要时 `sudo tailscale up`。  
   - 打开 Grok Bot / 本地执行等变绿。  
   - 可选：`ls /mnt/nas/data`；Langfuse compose；`codex remote-control start`。

3. **UPS 选型（19:45–19:50）**  
   - 负载粗算：日常约 40–90W，峰值多半 <150W；加绿联 NAS 再约 +20–40W。  
   - 要「撑半小时」看**电池能量**，不要只看 VA；线交互式即可；带 USB，Ubuntu 用 **NUT** 做低电量自动关机。  
   - 口径举例：约 600–1000VA，有效功率 300–500W；Smart-UPS 约 1000VA/700W 档半载常能到二三十分钟。铅酸寿命约 3–5 年。  
   - **未下单**，只定选型原则。

4. **默认 Ubuntu（19:52–19:59）**  
   - 用户：「我希望默认ubuntu」「没看到ubuntu呀。」  
   - 教：Del → Boot → **UEFI NVME Drive BBS Priorities**，把 ubuntu 调到该 NVMe 盘内第一；外层 Boot Option #1 仍指向该盘。  
   - 讲解：Boot Option #1 当时是 `NVME: Windows Boot Manager (...)`；BBS 决定盘内 Windows vs ubuntu；F11 临时选不改默认。  
   - NVMe = 该 1TB 固态；Windows 与 Ubuntu 同盘。  
   - 后经恢复脚本：`efibootmgr` 显示 **BootOrder Ubuntu 在前，Windows 在后**。

5. **Tailscale「一启动就连上」（20:00）**  
   - 用户：「现在Tailscale是放到启动项里了吗？为什么我启动它就连上了？」  
   - 答：不是 BIOS 启动项，是 `tailscaled` systemd 自启 + 本机已存登录态。

6. **恢复脚本（20:01–20:16）**  
   - 用户：「你帮我写一个开机状态恢复脚本吧。」「还有Grok bot只是一小点，我是说我之前整体上在这个主机上做了哪些操作。」「还有，不要弄混ubuntu还有Windows。」  
   - 脚本路径：**`~/bin/minigtr-recover.sh`**，只服务 Ubuntu。  
   - 检查项：网络、sudo、hostname、Tailscale、sshd、`/etc/nas-smb.cred` + `/mnt/nas/{data,projects,docker,personal_folder}`、Docker、Langfuse、Codex、Chrome、EFI。  
   - 当时本地执行灰掉（标签曾见 `cheng-minigtr-ubuntu` connected:false）。  
   - 用户纠正免密认知：「不对啊，我应该有了Tailscale就可以免密SSH。」→ 实测无 sshHostKeys；**此前从未** `tailscale set --ssh`。用户本机开后，经浏览器授权，从 Mac mini 经 Tailscale SSH 代跑成功。  
   - **失败链（可公开）**：首次代跑前 Mac→minigtr 普通 SSH 报 Permission denied；开 Tailscale SSH 后才通。脚本首跑出现「Tailscale 未入网」**假警报**（节点实际已在网且正用 Tailscale SSH 连着）→ 当晚修好误判逻辑，并保证 `~/.local/bin` 进 PATH。再跑结果：外网、eno1、sshd、Docker、四个 NAS 挂载均 OK；Codex remote-control 显示 connected；「完成：无失败（警告 0）」。

【所学】
- **问题**：常开枢纽失联时，先分不清是助手灰还是整机断电；复电后可能误进 Win11；服务与挂载要人盯；有 Tailscale 却误以为已经有免密壳。
- **定稿方案**：默认进 Ubuntu（EFI BootOrder / BBS，Ubuntu 优先于 Windows）；Ubuntu 侧固定脚本 `~/bin/minigtr-recover.sh`（只服务 Ubuntu）；复电后经 Tailscale SSH 代跑；UPS 选型原则已定（半小时看电池能量，带 USB，用 NUT 低电量关机），**尚未下单**。
- 「掉线」要先分：助手灰 ≠ 整机死；当晚是整机断电级。
- Tailscale 在线 ≠ Tailscale SSH；免密是单独开关 + ACL。
- 双系统恢复脚本必须写死「只服务哪一侧」，否则 Win/Ubuntu 混写必翻车。
- 默认系统改的是 EFI/BBS，不是「多装一个启动项」。
- UPS 买半小时续航要看 Wh/半载曲线，VA 数字会骗人。
- 恢复脚本要容错「已在网却被状态解析误判」这类假警报。

【行动指南】
- 若 minigtr 再断电：先确认物理开机进 Ubuntu → 跑 `~/bin/minigtr-recover.sh` 或让助手经 Tailscale SSH 代跑 → 再查 NAS/服务。  
- 若又误进 Win11：F11 选 ubuntu；长期靠 BootOrder/BBS，勿依赖每次手选。  
- 若要上 UPS：选带 USB 的线交互式，装 NUT；NAS 尽量同保或另配小 UPS。  
- 若以为「有 Tailscale 就能免密」：先查节点是否有 sshHostKeys / 是否执行过 `tailscale set --ssh`。

【补充说明】
- 凭证路径（不写秘密）：`/etc/nas-smb.cred`；Tailscale 本机状态由 `tailscaled` 管。  
- 固件键：F11=Boot Device，Del=Setup；Setup Prompt Timeout 曾见 1 秒；Fast Boot 关着更稳。  
- 交叉：开 Tailscale SSH →「全网 Tailscale SSH」篇；NAS 挂载细节 →「NAS 组网与三端 SMB」篇。  
- 来源对话：minigtr设备助手 19:43–20:16 段；细节台账留本地协作目录。
