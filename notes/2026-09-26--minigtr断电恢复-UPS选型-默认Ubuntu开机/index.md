# 2026-09-26--minigtr断电恢复-UPS选型-默认Ubuntu开机

> **今晚为何重要**：这是整晚的起点。minigtr 一断电，NAS 直连、Tailscale 入口、后续交换机网关全部失去远程抓手。当晚把「掉线→进 Ubuntu→开 Tailscale SSH→跑恢复脚本→默认 Ubuntu 启动」跑通，等于给家里常开枢纽装上了复电能力；后面局域网、共享存储、远程桌面都建立在这件事之上。

## 背景

- 时间：2026-09-26 **19:43:14 +08** 起（至约 20:16 恢复脚本代跑完成）。
- 助手：minigtr设备助手（agent `93cef072-a666-4ecc-bb6b-e48130b0817d`）。
- 主机：minigtr，用户 `viruspc`；Ubuntu 主用 + Win11 双系统（同一块 YMTC PC41Q-1TB-B NVMe）。
- 触发用户原文：「**我的minigtr是不是掉线了**」→「**电源断了下，刚重新开机，我怎么恢复**」→「**我需要某种不间断电源。**」→「**断电还能撑半个小时。**」→「**而且我觉得我每个主机都需要准备好一键恢复脚本。**」→「**我希望默认ubuntu**」。

## 主题

这场在办常开枢纽的复电能力：分清是助手灰还是整机死、稳住默认进 Ubuntu、写好只服务 Ubuntu 的一键恢复脚本、必要时经 Tailscale SSH 从邻机代跑，并定下 UPS 选型原则（半小时续航看电池能量，带 USB 用 NUT 自动关机）。

- 难点：失联表象像「助手掉线」，实际可能是整机不在网；只重启助手不够。
- 难点：双系统固件常优先进 Windows；改默认要动盘内 BBS 启动顺序，F11 临时选手选不改默认。
- 难点：Tailscale 在线不等于已开 Tailscale SSH；免密远程登录是单独开关，未开就不能代跑。
- 难点：恢复脚本若混写 Windows / Ubuntu 必翻车；UPS 只看 VA 数字会买错续航。

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
- **未下单**，只定选型原则。当时比较的是「只看 VA 买大数字」与「按半载续航与 USB/NUT」——认后者。

### 默认 Ubuntu（19:52–19:59）

- 用户：「我希望默认ubuntu」「没看到ubuntu呀。」
- 教：Del → Boot → **UEFI NVME Drive BBS Priorities**，把 ubuntu 调到该 NVMe 盘内第一；外层 Boot Option #1 仍指向该盘。
- 讲解：Boot Option #1 当时是 `NVME: Windows Boot Manager (...)`；BBS 决定盘内 Windows vs ubuntu；F11 临时选不改默认。
- NVMe = 该 1TB 固态；Windows 与 Ubuntu 同盘。
- 后经恢复脚本：`efibootmgr` 显示 **BootOrder Ubuntu 在前（0002），Windows 在后**。
- 取舍：临时 F11 只应急；长期靠 BBS 钉死默认，不靠每次手选。

### Tailscale「一启动就连上」（20:00）

- 用户：「现在Tailscale是放到启动项里了吗？为什么我启动它就连上了？」
- 答：不是 BIOS 启动项，是 `tailscaled` systemd 自启 + 本机已存登录态。

### 恢复脚本（20:01–20:16）

- 用户：「你帮我写一个开机状态恢复脚本吧。」「还有Grok bot只是一小点，我是说我之前整体上在这个主机上做了哪些操作。」「还有，不要弄混ubuntu还有Windows。」
- 脚本路径：**`~/bin/minigtr-recover.sh`**，只服务 Ubuntu。
- 检查：网络、sudo、hostname、Tailscale、sshd、`/etc/nas-smb.cred` + `/mnt/nas/{data,projects,docker,personal_folder}`、Docker、Langfuse、Codex、Chrome、EFI。
- 当时本地执行灰掉（标签曾见 `cheng-minigtr-ubuntu` connected:false）。
- 用户纠正免密认知：「不对啊，我应该有了Tailscale就可以免密SSH。」→ 实测无 sshHostKeys；**此前从未** `tailscale set --ssh`。用户本机开后，经浏览器授权，从 Mac mini Tailscale SSH 代跑成功。
- 脚本修了 Tailscale 误判（已在网却被判未入网的假警报），并保证 `~/.local/bin` 进 PATH。外网、eno1、sshd、Docker、四个 NAS 挂载均 OK。

## 结果

做成了：

- 确认当晚是整机断电级失联，不是只灰助手。
- 默认启动已钉成 Ubuntu 优先（`efibootmgr` BootOrder Ubuntu 在前）。
- 写好并代跑通过 `~/bin/minigtr-recover.sh`（只服务 Ubuntu）；外网、sshd、Docker、四个 NAS 挂载检查通过；修好 Tailscale 误判假警报。
- 本机开通 Tailscale SSH，并从 Mac mini 代跑成功。

还剩：

- UPS **未下单**，仅定选型原则（线交互式、看电池能量、带 USB + NUT）。
- 恢复脚本覆盖的是当晚已知检查项；以后若服务清单变了要再扩脚本。

## 所学

- 「掉线」要先分：助手灰 ≠ 整机死；当晚是整机断电级。
- Tailscale 在线 ≠ Tailscale SSH；免密远程登录是单独开关，还要配合访问控制。
- 双系统恢复脚本必须写死「只服务哪一侧」，否则 Windows / Ubuntu 混写必翻车。
- 默认系统改的是固件启动顺序，不是「多装一个启动项」。
- UPS 买半小时续航要看电池能量和半载曲线，VA 数字会骗人。

取舍补充：

- 进错系统：F11 临时选手选 vs 改 BBS 钉死默认——长期认后者，前者只应急。
- UPS：只看 VA 大数字 vs 按半载续航 + USB/NUT——认后者；当晚不下单，只定原则。
- 代跑：以为「有 Tailscale 就能免密」vs 必须单独 `tailscale set --ssh`——认必须开 SSH 开关后再代跑。
- 脚本范围：只恢复 Grok Bot vs 覆盖整机已知操作——按用户要求覆盖网络 / Tailscale / 挂载 / Docker 等，并写死只服务 Ubuntu。

## 行动指南

### 主题行动指南

#### 背景

家里有一台常开枢纽，上面挂着组网入口、共享挂载和关键服务；双系统时固件还可能优先进 Windows。

#### 核心问题

枢纽失联或刚复电后，不知道是助手挂了还是整机断电，也不知道怎么稳定回到「默认系统可进、服务可验收、必要时能从邻机代跑」的状态。

#### 核心解决方案

按顺序做：

1. 先分清是助手掉线还是整机失联；若是整机，先完成物理开机。不做：只重启助手或只查网络就当恢复完成。
2. 确认进入约定的默认系统；若进错系统，先改启动选择或固件启动顺序，再继续。相关可选项：每次 F11 手选——只应急；长期用固件盘内启动顺序钉死默认。
3. 确认 Tailscale 在线；若需要从邻机代跑，事先已开通 Tailscale SSH（组网在线不等于能远程登录）。不做：把「节点在线」当成已能免密登录。
4. 运行固定恢复流程，把网络、Tailscale、共享挂载和关键服务拉回已知好状态。不做：写一份混用两套系统的脚本。
5. 用验收标准逐项核对；未通过的项回到对应步骤处理。
6. （一次性定稿）把默认系统用固件启动顺序钉死，不靠每次手选。

#### 验收标准

以后按本主题执行复电或排障时，下列全部成立才算完成：

- 机器进入约定的默认系统（不是误进另一套系统）。
- 固定恢复流程跑完，网络、Tailscale、共享挂载与关键服务均通过检查。
- 需要远程代跑时，能从邻机经已开通的 Tailscale SSH 完成，不必人一直守在屏幕前。

### 细节与其他

#### 若 minigtr 再断电

则：

1. 确认物理已通电。
2. 确认进了 Ubuntu；若误进 Win11，先按下一则处理。
3. 跑 `~/bin/minigtr-recover.sh`，或让助手经 Tailscale SSH 从邻机代跑。
4. 脚本通过后再查 NAS 挂载与 Docker 等服务。

相关可选项：只等 Grok Bot 变绿——不够，须跑固定恢复流程。

#### 若又误进 Win11

则：

- 临时：人在机前看到开机画面时，按 **F11** 选 `ubuntu`。
- 长期：进入 Del → Boot → **UEFI NVME Drive BBS Priorities**，把 ubuntu 调到该 NVMe 盘内第一（外层 Boot Option #1 仍指向该盘），不要依赖每次手选。

不做：把「多装一个启动项」当成改默认。

#### 若以为「有 Tailscale 就能免密登录」

则：先确认节点已 `tailscale up` 在线，再查是否有 sshHostKeys、是否执行过 `tailscale set --ssh`；未开就先开，再谈代跑恢复脚本。仅 Tailscale 在线不够。不做：用往 authorized_keys 塞公钥替代长期通道（见主题 02 交办口径）。

#### 若要从邻机代跑恢复

则：邻机须已能经 Tailscale SSH 登入 minigtr（用户 `viruspc`）；本机须事先执行过 `tailscale set --ssh`。恢复脚本路径：`~/bin/minigtr-recover.sh`（只服务 Ubuntu）。

#### 若要上 UPS

则：选带 USB 的线交互式（约 600–1000VA、有效功率约 300–500W 档），半小时看电池能量而非只看 VA；Ubuntu 用 **NUT** 做低电量自动关机；NAS 尽量同保或另配小 UPS。不做：只按 VA 数字下单。当晚尚未下单，此处只按选型原则。

## 补充说明

- 凭证路径（不写秘密）：`/etc/nas-smb.cred`；Tailscale 本机状态由 `tailscaled` 管；历史上 `~/.grokbot`。
- 固件键：F11 = Boot Device，Del = Setup；Setup Prompt Timeout 曾见 1 秒；Fast Boot 关着更稳。
- 交叉：开 Tailscale SSH → [主题 02](../2026-09-26--%E5%85%A8%E7%BD%91Tailscale-SSH%E5%BC%80%E9%80%9A%E4%B8%8E4070ts%E6%94%B9%E5%90%8D/index.md)；NAS 挂载细节 → [主题 04](../2026-09-26--NAS%E7%BB%84%E7%BD%91%E4%B8%8E%E4%B8%89%E7%AB%AFSMB%E6%8C%82%E8%BD%BD-photos%E4%B8%8Edata-shared/index.md)。
- 来源对话：minigtr设备助手 19:43–20:16 段。
