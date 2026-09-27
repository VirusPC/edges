# 2026-09-26--NAS组网与三端SMB挂载-photos与data-shared

> **今晚为何重要**：拓扑通了不等于「NAS 能当磁盘用」。当晚第一次把 **Windows / Mac mini / mini GTR** 三端对绿联共享的映射对齐，并定下「少建独立共享、多用 `data/shared` 子目录」的约定——否则每新建一个 UGOS 共享，三台机器都要人工补挂，长期不可维护。

【背景】
- SMB 主战场约 **23:45–23:55**；更早有 NAS Tailscale/网线背景（20:18–20:21）。  
- 助手：IT资产管理；minigtr 侧原有 fstab。  
- NAS：绿联 DXP4800 Plus，UGOS；节点短名 `nas`；触点写「家庭 LAN 上的 NAS」或 MagicDNS `nas`。  
- 用户原文：「**我现在其他三台，都可以把nas当磁盘用了吗**」「**mac mini 和 windows 都配下**」「**我nas上新建了一个共享文件夹，为啥windows没有自动同步，看不到**」「**有什么自动共享的手段么**」「**用英文**」。

【过程】
1. **23:45 现状**  
   - GTR：已挂 `/mnt/nas` 下 data/projects/docker/personal_folder。  
   - Windows：到 NAS 的 SMB 端口通，**尚未映射盘符**；资源管理器不会自动出现盘符，要映射或浏览 UNC（公开稿写「家庭 LAN 上的 NAS」短名触点，不写主机号段）。  
   - Mac：有线 ping/SMB 失败；经 Mesh 上的 nas 端口通，未挂本地目录。  
   - **失败链**：助手先报「三台还不能都当磁盘用」——端口通 ≠ 已挂载；Mac 有线未通是独立问题，当晚用 Mesh 绕过。

2. **23:47 首轮四共享**  
   Windows（持久）：`N:` data，`P:` projects，`O:` docker，`Q:` personal_folder → 指向家庭 LAN 上的 NAS 各共享。  
   Mac：`~/NAS/{…}`（**经 Mesh 上的 nas**，因有线未通）。凭证临时文件已清。

3. **新共享 `photos` 不会自动出现**  
   - 各 OS「挂过什么才有什么」。可先浏览家庭 LAN 上的 NAS 的 `photos` 共享。  
   - **失败链（公开）**：用户以为「NAS 上新建共享 → Windows 自动多盘符」；实测只有已映射的四个；新共享要再映一次（或浏览即用）。

4. **四种手段，用户选「先同步 photos + 第4种通用」**  
   1 浏览即用；2 开机自动挂；3 清单脚本；4 **少建共享、在大共享下建子文件夹** ← 通用做法。

5. **23:52 `photos` 三端补挂**  
   - Win：`R:` → photos（持久）  
   - Mac：`~/NAS/photos`（经 Mesh）  
   - GTR：`/mnt/nas/photos`（写入 fstab）

6. **23:54–23:55 通用目录**  
   - 中文 `共用` → 用户「用英文」→ **`data/shared/{docs,downloads,tmp,media,README.txt}`**  
   - 入口：Win `N:\shared`；Mac `~/NAS/data/shared`；GTR `/mnt/nas/data/shared`

【所学】
- 「NAS 上新建共享」≠「客户端自动多盘符」。  
- Mac 有线未通时用 Mesh 挂载是技术债：能用，但重启后可能要再挂；应迁回家庭 LAN。  
- 独立共享只在需要隔离权限/备份策略时再开。

【行动指南】
- **这一题怎么打**：有线拓扑通了之后，要把共享存储真正当磁盘用：在各客户端对齐映射，并坚持「少建独立共享、多用约定子目录」。目标状态是全家有统一入口，新材料默认进约定共享路径，不必每开一个独立共享就各端再补挂。
- **动手前先确认这些**（没有下面这些，先别动手）：
  - 有线局域网已定稿（主题 03）：能通到 NAS 的 LAN 触点 `〈LAN:nas〉`；Mac 若有线 ping/445 仍失败，可临时经 Tailscale 触点挂载（属技术债，通线后应迁回 LAN）。
  - Windows：端口 445 已通，且准备做**持久**盘符映射（当晚：`N:` data、`P:` projects、`O:` docker、`Q:` personal_folder、`R:` photos）。
  - Mac：能写 `~/NAS/...`；凭证用临时文件配置后清空，不进聊天。
  - GTR：`/etc/nas-smb.cred` 已存在、可写 fstab；挂载点在 `/mnt/nas/*`；复电验收可配合 `minigtr-recover.sh`。
  - 新建**独立**共享前：先确认真需要隔离权限/备份策略，并接受「须三端同时补挂」。
- **什么时候怎么做**：
  - 若有新材料要全家共用：前置——三端已挂好 `data`。则优先丢进 `data/shared/{docs,downloads,tmp,media}/...`（Win `N:\shared`；Mac `~/NAS/data/shared`；GTR `/mnt/nas/data/shared`）。
  - 若必须新开独立共享：前置——见上「隔离策略 + 三端补挂」。则同时改 Win 映射、Mac `~/NAS`、GTR fstab（当晚 `photos` 曾补 `R:` / `~/NAS/photos` / `/mnt/nas/photos`）；不要指望 UGOS 新建后客户端自动出盘符。
  - 若 Mac 有线恢复：前置——Mac 有线 ping 与 445 已通。则把 SMB 从 `〈TS:nas〉` 迁到 `〈LAN:nas〉`。
  - 若 GTR 复电后盘没有：前置——已进 Ubuntu。则查 `/etc/nas-smb.cred`（只记路径）与 recover 脚本；「445 通」不等于「已挂载」。

【补充说明】
### 挂载速查（脱敏）
| 共享 | Windows | Mac mini | mini GTR |
|---|---|---|---|
| data | `N:` | `~/NAS/data`（经 Mesh） | `/mnt/nas/data` |
| projects | `P:` | `~/NAS/projects` | `/mnt/nas/projects` |
| docker | `O:` | `~/NAS/docker` | `/mnt/nas/docker` |
| personal_folder | `Q:` | `~/NAS/personal_folder` | `/mnt/nas/personal_folder` |
| photos | `R:` | `~/NAS/photos` | `/mnt/nas/photos` |
| 通用 | `N:\shared` | `~/NAS/data/shared` | `/mnt/nas/data/shared` |

精确 UNC / 主机号段字面量 → 本地 by-agent（不进公开库）。交叉：网段 →「交换机重建局域网」篇。
