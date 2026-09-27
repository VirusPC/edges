# 2026-09-26--minigtr断电恢复-UPS选型-默认Ubuntu开机

> **今晚为何重要**：这是整晚的起点。minigtr 一断电，NAS 直连、Tailscale 入口、后续交换机网关全部失去远程抓手。当晚把「掉线→进 Ubuntu→开 Tailscale SSH→跑恢复脚本→默认 Ubuntu 启动」跑通，等于给家里常开枢纽装上了复电能力；后面局域网、共享存储、远程桌面都建立在这件事之上。

## 背景

- 时间：2026-09-26 **19:43:14 +08** 起（至约 20:16 恢复脚本代跑完成）。
- 助手：minigtr设备助手（agent `93cef072-a666-4ecc-bb6b-e48130b0817d`）。
- 主机：minigtr，用户 `viruspc`；Ubuntu 主用 + Win11 双系统（同一块 YMTC PC41Q-1TB-B NVMe）。
- 触发用户原文：「**我的minigtr是不是掉线了**」→「**电源断了下，刚重新开机，我怎么恢复**」→「**我需要某种不间断电源。**」→「**断电还能撑半个小时。**」→「**而且我觉得我每个主机都需要准备好一键恢复脚本。**」→「**我希望默认ubuntu**」。

## 过程

### 掉线确认（19:43）

助手结论原文要点：Grok Bot 本地执行未连接；从 Mac mini ping Tailscale 地址全丢包，SSH 超时；「不像是只挂了助手，更像整机不在网」。Mac mini 当时在线。

### 人工开机后的恢复口径（19:44）

- 进 Ubuntu：若直接进 Win11，重启按 **F11** 选 `ubuntu`（固件常优先 Windows）；**Del** 进 Setup。
- 登录 `viruspc`，确认能上网；企业 Wi‑Fi 用 PEAP+MSCHAPv2。
- `tailscale status`；必要时 `sudo tailscale up`。
- 打开 Grok Bot / 本地执行等变绿。
- 可选：`ls /mnt/nas/data`；Langfuse compose；`codex remote-control start`。

### UPS 选型（19:45–19:50）

- 负载粗算：日常约 40–90W，峰值多半 <150W；加绿联 NAS 再约 +20–40W。
- 要「撑半小时」看**电池能量**，不要只看 VA；线交互式即可；带 USB，Ubuntu 用 **NUT** 做低电量自动关机。
- 口径举例：约 600–1000VA，有效功率 300–500W；Smart-UPS ~1000VA/700W 档半载常能到二三十分钟。铅酸寿命约 3–5 年。
- **未下单**，只定选型原则。

### 默认 Ubuntu（19:52–19:59）

- 用户：「我希望默认ubuntu」「没看到ubuntu呀。」
- 教：Del → Boot → **UEFI NVME Drive BBS Priorities**，把 ubuntu 调到该 NVMe 盘内第一；外层 Boot Option #1 仍指向该盘。
- 讲解：Boot Option #1 当时是 `NVME: Windows Boot Manager (...)`；BBS 决定盘内 Windows vs ubuntu；F11 临时选不改默认。
- NVMe = 该 1TB 固态；Windows 与 Ubuntu 同盘。
- 后经恢复脚本：`efibootmgr` 显示 **BootOrder Ubuntu 在前（0002），Windows 在后**。

### Tailscale「一启动就连上」（20:00）

- 用户：「现在Tailscale是放到启动项里了吗？为什么我启动它就连上了？」
- 答：不是 BIOS 启动项，是 `tailscaled` systemd 自启 + 本机已存登录态。

### 恢复脚本（20:01–20:16）

- 用户：「你帮我写一个开机状态恢复脚本吧。」「还有Grok bot只是一小点，我是说我之前整体上在这个主机上做了哪些操作。」「还有，不要弄混ubuntu还有Windows。」
- 脚本路径：**`~/bin/minigtr-recover.sh`**，只服务 Ubuntu。
- 检查：网络、sudo、hostname、Tailscale、sshd、`/etc/nas-smb.cred` + `/mnt/nas/{data,projects,docker,personal_folder}`、Docker、Langfuse、Codex、Chrome、EFI。
- 当时本地执行灰掉（标签曾见 `cheng-minigtr-ubuntu` connected:false）。
- 用户纠正免密认知：「不对啊，我应该有了Tailscale就可以免密SSH。」→ 实测无 sshHostKeys；**此前从未** `tailscale set --ssh`。用户本机开后，经浏览器授权，从 Mac mini Tailscale SSH 代跑成功。
- 脚本修了 Tailscale 误判，并保证 `~/.local/bin` 进 PATH。外网、eno1、sshd、Docker、四个 NAS 挂载均 OK。

## 所学

- 「掉线」要先分：助手灰 ≠ 整机死；当晚是整机断电级。
- Tailscale 在线 ≠ Tailscale SSH；免密远程登录是单独开关，还要配合访问控制。
- 双系统恢复脚本必须写死「只服务哪一侧」，否则 Windows / Ubuntu 混写必翻车。
- 默认系统改的是固件启动顺序，不是「多装一个启动项」。
- UPS 买半小时续航要看电池能量和半载曲线，VA 数字会骗人。

## 行动指南

### 主题行动指南

**背景**：家里有一台常开枢纽，上面挂着组网入口、共享挂载和关键服务；双系统时固件还可能优先进 Windows。

**核心问题**：枢纽失联或刚复电后，不知道是助手挂了还是整机断电，也不知道怎么稳定回到「默认系统可进、服务可验收、必要时能从邻机代跑」的状态。

**核心解决方案**：先确认是整机级问题并进入约定的默认系统；用固定恢复流程把网络、Tailscale、共享挂载和关键服务拉回已知好状态；远程代跑依赖事先开通的 Tailscale SSH，而不是「组网在线就等于能登录」。默认系统用固件启动顺序钉死，不靠每次手选。

### 细节与其他

#### 前置条件

- 人能碰到电源和键盘完成开机与选系统；或邻机已经能经 Tailscale SSH 登入这台枢纽（须先执行过 `tailscale set --ssh`，仅 Tailscale 在线不够）。
- 确认已进 **Ubuntu**（用户 `viruspc`），不是误进 Win11；双系统脚本只服务 Ubuntu。
- 恢复脚本已存在：`~/bin/minigtr-recover.sh`。
- 改默认启动或进固件：人在机前，能按 **Del**（Setup）或 **F11**（临时选盘）。
- 上 UPS：需求是约半小时续航；当晚尚未下单，这里只按选型原则采购。

#### 分情形做法

- 如果 minigtr 再断电：先确认物理已通电，且确认进了 Ubuntu（误进 Win11 就先处理下一则）。再跑 `~/bin/minigtr-recover.sh`，或让助手经 Tailscale SSH 从邻机代跑；脚本通过后再查 NAS 挂载与 Docker 等服务。
- 如果又误进 Win11：先确认人在机前看得到开机画面。临时用 **F11** 选 ubuntu；长期在 Del → Boot → **UEFI NVME Drive BBS Priorities** 把 ubuntu 调到该 NVMe 盘内第一（外层 Boot Option #1 仍指向该盘），不要依赖每次手选。
- 如果以为「有 Tailscale 就能免密登录」：先确认节点已 `tailscale up` 在线。再查是否有 sshHostKeys、是否执行过 `tailscale set --ssh`；未开就先开，再谈代跑恢复脚本。

#### 其他（与主题弱相关）

- 如果要上 UPS：选带 USB 的线交互式（约 600–1000VA、有效功率约 300–500W 档），半小时看电池能量而非只看 VA；Ubuntu 用 **NUT** 做低电量自动关机；NAS 尽量同保或另配小 UPS。当晚未下单。

## 补充说明

- 凭证路径（不写秘密）：`/etc/nas-smb.cred`；Tailscale 本机状态由 `tailscaled` 管；历史上 `~/.grokbot`。
- 固件键：F11 = Boot Device，Del = Setup；Setup Prompt Timeout 曾见 1 秒；Fast Boot 关着更稳。
- 交叉：开 Tailscale SSH → 主题 02；NAS 挂载细节 → 主题 04。
- 来源对话：minigtr设备助手 19:43–20:16 段。
