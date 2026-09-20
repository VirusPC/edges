# 2026-09-20--机械师Mini-GTR-Ubuntu双系统安装

【背景】

机械师 Mini GTR（对话称呼 minigtr，Windows 侧 Grok Bot 登记名另计）原本是 Windows 11 家庭版迷你主机。目标是在保留 Windows 的前提下加装 Ubuntu Desktop，并且以后**大部分时间当 Linux 服务器用**，所以 Linux 分区要给足空间，而不是随便划一小块。

同期还要解决：用已有金士顿 U 盘做安装介质、弄清本机固件热键、装完能进 Ubuntu、能上网、能打中文。安装计划按 writing-plans 写成可勾选任务，并落在 edges 的 `docs/superpowers/plans/`（相关 PR 已开过）。

【过程】

1. **摸清机器与介质**  
   确认本机约 64GB 内存、Ryzen 7 255 / Radeon 780M、约 1TB NVMe（GPT）。磁盘大致是：恢复分区 + EFI + MSR + `C:`（Windows，约 200GB）+ `D:`（约 752GB，几乎全空）。金士顿 DataTraveler 挂成可移动盘，容量约 115GB，足够写桌面版 ISO。

2. **安全预检（需管理员）**  
   BitLocker：`C:` / `D:` 均为保护关闭、完全解密。固件类型 UEFI；Secure Boot 为开。关闭快速启动（休眠相关也关掉）。创建 Windows 还原点，描述为 Before Ubuntu dual-boot。固件热键经实机确认：**F11** 进 Boot Device，**Del** 进 Setup（不是常见笔记本上的 F7）。

3. **下载与校验 ISO**  
   下载 Ubuntu Desktop **24.04.5.1** amd64 到 `D:\iso\`，按官方 SHA256SUMS 校验通过。下载过程中本机曾离线导致进度中断，恢复在线后继续；期间把电源设为永不睡眠，屏保 1 小时、关屏 6 小时，避免长传被睡眠打断。用每 5 分钟例程汇报进度，下完校验通过后例程自删。

4. **制作安装 U 盘**  
   Rufus 无法可靠静默写盘。在确认目标盘是金士顿 USB（非系统盘）后，管理员权限清空该 U 盘，把 ISO 直接写入物理盘。写完后 U 盘呈 GPT，可作为 UEFI 安装介质。

5. **给 Ubuntu 腾空间**  
   因主要当 Linux 服务器用，不采用最初草稿里的 160GiB，最终从 `D:` **压缩 640GiB**（655360 MB）。用户明确授权后，由助手用 `Resize-Partition` 代执行：`D:` 约剩 112GB，Disk 0 出现约 640GB 未分配；`C:`、EFI、恢复分区未动。计划里本规定「分区须用户手点」，此次是用户书面授权后的例外。

6. **安装器路径**  
   F11 选 UEFI 金士顿进入 live。联网页选 Wi‑Fi 曾卡住（无密码框、按钮一直 loading），安装器一度自己退出；回到 live 后重开安装，选 **不连接网络**。安装方式选 **Interactive**，不用 Automated。应用选默认集。磁盘页可选 Alongside Windows Boot Manager（因未分配已备好）；用户反映一路点下没有清晰「占用多少盘」摘要，仍继续 Installing。账号页创建本地用户（主机名后改为 minigtr）。

7. **装完启动**  
   提示拔 U 盘回车后直接进了 Windows：固件仍优先 Windows Boot Manager。再用 F11 选 ubuntu 项，成功进入 Ubuntu。`df -h /` 显示根分区约 **629G** 可用量级（约 14G 已用），与预留约 640GiB 相符（文件系统开销后略小属正常）。

8. **上网与中文输入**  
   桌面右上角起初几乎看不到 Wi‑Fi，设置里仍有 Wi‑Fi 项。公司网为 WPA2 Enterprise：默认 Tunneled TLS 连不上，改成 **PEAP + MSCHAPv2**，并勾选不要求 CA 证书后成功。随后在 Ubuntu 登记 Grok Bot 本机执行；安装 `ibus-libpinyin` 等包（需用户自己输 sudo 密码），助手用 gsettings 加入智能拼音输入源，**Super+空格** 切换。对话主机标签由误写的 mingtr 更正为 **minigtr**；Mesh VPN 节点名侧已是 minigtr 一名。

【所学】

- **双系统里「谁点分区」是风险边界，不是能力边界。** 助手能用 PowerShell 压缩卷，但错盘/错容量代价高；默认应人手确认。只有在空间数字写死、盘符与 Disk 编号双重校验、用户明确授权时，代执行才合理。

- **先造未分配，再装系统，比让安装器临时压缩更可控。** 新版 Ubuntu 的 Alongside 往往不再单独展示「将占用多少」，容易心里没底；若未分配是自己压出来的，Alongside 通常就吃这块空闲。摘要含糊时仍应退回 Manual。

- **装完进 Windows ≠ 没装上 Ubuntu。** 常见原因是固件 Boot Order 仍把 Windows Boot Manager 放最前。应用 F11 临时选 ubuntu，或进 Setup 调整顺序，而不是立刻重装。

- **企业 Wi‑Fi 的「认证方式」必须和公司侧一致。** 界面默认 TTLS、公司只开 PEAP 时会表现为连不上或按钮异常；改 PEAP 不是玄学，是协议对齐。家庭 Wi‑Fi 一般只需 Personal 密码，不要误走 Enterprise 表单。

- **核显走开源 amdgpu 即可，勿装 NVIDIA 专有驱动。** 本机是 Ryzen 核显路线；装错驱动族会自找麻烦。

- **长下载要先解决睡眠与离线。** ISO 数 GB 级时，本机执行掉线或睡眠会让进度停滞；电源策略与「下完再通知」比反复手查更稳。

【行动指南】

- **若**再在 Windows 上给 Linux 腾空间，且空闲主要在数据盘：  
  **则**优先压缩数据盘（如此次 `D:`），不动系统盘 `C:` 与 EFI；服务器用途把大头分给 Linux（本次 640GiB 量级），Windows 只留应急与文件交换。

- **若**要用助手代压缩分区：  
  **则**先核对 Disk 编号、FriendlyName、BusType、目标盘符，写出「缩小多少 / 新大小多少」，用户明确授权后再 `Resize-Partition`；禁止在未授权时清盘或动 EFI。

- **若**制作 Ubuntu UEFI 安装 U 盘且 Rufus 不能静默：  
  **则**确认 U 盘型号无误后，可对 USB 物理盘写入 hybrid ISO；写前备份 U 盘内容，写后确认分区风格为 GPT。

- **若**安装器在联网页卡住或崩溃：  
  **则**选「不连接互联网」继续；系统装完再连网。企业 Wi‑Fi 优先试 PEAP+MSCHAPv2，并按需勾选不校验 CA。

- **若**装完拔 U 盘后只进 Windows：  
  **则**先 F11 找 ubuntu；没有再 Del 进 Setup 调 Boot Order。进 Linux 后用 `df -h /` 确认根分区体量是否符合预期。

- **若**在 Ubuntu 24.04 桌面装中文拼音：  
  **则**安装 `ibus-libpinyin` 与中文语言包，把 `ibus`/`libpinyin` 加入输入源，用 Super+空格切换；`sudo` 密码必须由用户本机输入。

- **若**主机对话名与远程组网节点名不一致：  
  **则**统一成同一短名（本次为 minigtr），避免多套旧名并存难检索。

【补充说明】

**硬件与分区结果（脱敏摘要）**

| 项 | 内容 |
| --- | --- |
| 机型 | 机械师 Mini GTR |
| CPU / 核显 | Ryzen 7 255 / Radeon 780M |
| 内存 | 约 64GB |
| 系统盘 | 约 1TB NVMe，GPT |
| Windows | Win11 家庭版，保留；`C:` 约 200GB；`D:` 压缩后约 112GB |
| Ubuntu | 24.04 LTS 桌面；根分区 `df` 约 629G 量级 |
| 固件键 | F11 = Boot Device；Del = Setup |
| 安装介质 | 金士顿 U 盘，ISO 直写，GPT/UEFI |

**安装器选项对照**

| 选项 | 本次选择 | 原因 |
| --- | --- | --- |
| Interactive / Automated | Interactive | Automated 易清盘，不适合双系统 |
| 联网 | 最终不连，装后再连 | 安装器 Wi‑Fi 曾卡死 |
| Alongside / Erase / Manual | Alongside（未分配已备好） | 省事；摘要不清时可改 Manual |
| 企业 Wi‑Fi 认证 | PEAP（非默认 TTLS） | 与公司侧配置一致 |

**计划文档**

- edges 中有 writing-plans 风格安装计划：`docs/superpowers/plans/2026-09-20-machenike-minigtr-ubuntu-dual-boot.md`。其中默认压缩量原稿为 160GiB，实操已按服务器用途改为 640GiB，笔记以实操为准。

**尚未做完（可选后续）**

- 把固件默认启动改为 ubuntu/GRUB，减少每次 F11。  
- 在 Linux 侧重装或登录远程组网客户端，主机名保持 minigtr。  
- 服务器向的 ssh、防火墙、自动更新等加固（本次未展开）。

**参考链接**

- [Ubuntu Desktop 下载](https://ubuntu.com/download/desktop) — 官方桌面 ISO 入口；本次用 24.04 LTS 点版本。  
- [Ubuntu releases SHA256SUMS（24.04）](https://releases.ubuntu.com/24.04/SHA256SUMS) — 校验 ISO 完整性。  
- [Rufus](https://rufus.ie/) — Windows 上常用启动盘工具；其命令行不足以无人值守写盘。  
- [IBus LibPinyin](https://github.com/libpinyin/ibus-libpinyin) — Ubuntu 上智能拼音输入方案之一。  
