# 2026-09-26--NAS组网与三端SMB挂载-photos与data-shared

> **今晚为何重要**：拓扑通了不等于「NAS 能当磁盘用」。当晚第一次把 **Windows / Mac mini / mini GTR** 三端对绿联共享的映射对齐，并定下「少建独立共享、多用 `data/shared` 子目录」的约定——否则每新建一个 UGOS 共享，三台机器都要人工补挂，长期不可维护。

## 背景

- SMB 主战场约 **23:45–23:55**；更早有 NAS Tailscale / 网线背景（20:18–20:21）。
- 助手：IT资产管理；minigtr 侧原有 fstab。
- NAS：绿联 DXP4800 Plus，UGOS；节点名 `nas`；LAN 占位 `〈LAN:nas〉`。
- 用户原文：「**我现在其他三台，都可以把nas当磁盘用了吗**」「**mac mini 和 windows 都配下**」「**我nas上新建了一个共享文件夹，为啥windows没有自动同步，看不到**」「**有什么自动共享的手段么**」「**用英文**」。

## 主题

这场在把 NAS 共享产品化成三端磁盘：对齐 Windows / Mac / mini GTR 的持久挂载，补上新建的 `photos`，并定下「少建独立共享、在大共享下用英文子目录（`data/shared`）」作为全家共用入口。

- 难点：「NAS 上新建共享」不等于「客户端自动多出一个盘符」；各系统只认自己挂过的。
- 难点：「端口通」不等于「已挂载」；复电后仍要查挂载本身。
- 难点：Mac 当时有线未通，只能临时经 Tailscale 挂载，形成须迁回局域网的技术债。
- 难点：若每次共用都新开独立共享，三端都要人工补挂，长期不可维护。

## 过程

### 现状核对（23:45）

- GTR：已挂 `/mnt/nas` 下 data / projects / docker / personal_folder。
- Windows：`445` 通，**尚未映射盘符**。
- Mac：有线 ping / 445 失败；Tailscale 上 `445` 通，未挂本地目录。

### 首轮四共享（23:47）

- Windows（持久）：`N:` data，`P:` projects，`O:` docker，`Q:` personal_folder → `\\〈LAN:nas〉\…`
- Mac：`~/NAS/{…}`（**经 `〈TS:nas〉`**，因有线未通）。凭证临时文件已清。
- 取舍：Mac 有线不通时用组网触点临时代挂，并记为技术债，通线后应迁回局域网。

### 新共享不会自动出现

- 用户新建 `photos` 后 Windows 看不到——各 OS「挂过什么才有什么」。可先浏览 `\\〈LAN:nas〉\photos`。

### 四种手段与选型（23:52 前）

1. 浏览即用；2. 开机自动挂；3. 清单脚本；4. **少建共享、在大共享下建子文件夹** ← 用户选「先同步 photos + 第 4 种通用」。
- 取舍：不把「每新建 UGOS 共享就全网补挂」当默认；日常共用靠子目录约定。

### photos 三端补挂（23:52）

- Win：`R:` → photos（持久）
- Mac：`~/NAS/photos`（Tailscale）
- GTR：`/mnt/nas/photos`（写入 fstab）

### 通用目录定稿（23:54–23:55）

- 中文 `共用` → 用户「用英文」→ **`data/shared/{docs,downloads,tmp,media,README.txt}`**
- 入口：Win `N:\shared`；Mac `~/NAS/data/shared`；GTR `/mnt/nas/data/shared`

## 结果

做成了：

- Windows 持久映射：`N:` data、`P:` projects、`O:` docker、`Q:` personal_folder、`R:` photos。
- Mac 挂到 `~/NAS/...`（当时经 Tailscale）；GTR 含 photos 写入 fstab。
- 定稿全家共用入口：`data/shared/{docs,downloads,tmp,media}`；约定少建独立共享。

还剩：

- Mac 有线当时未通，SMB **仍走 Tailscale 触点**，属技术债；通线后应迁回局域网地址。
- 「自动发现新共享」没有产品级手段；以后新开独立共享仍须三端同时补挂。

## 所学

- 「NAS 上新建共享」不等于「客户端自动多出一个盘符」。
- Mac 有线未通时用 Tailscale 挂载是技术债，通线后应迁回局域网地址。
- 独立共享只在需要隔离权限或备份策略时再开；日常共用靠子目录约定更可维护。
- 「端口通」不等于「已挂载」。

取舍补充：

- 自动共享四种手段：浏览即用 / 开机自动挂 / 清单脚本 / 少建共享用子目录——用户选「先同步 photos + 第 4 种」；不把每新建共享就全网补挂当默认。
- 挂载触点：优先有线局域网 vs 临时经组网——有线不通时用后者并记债。
- 目录名：中文「共用」vs 英文 `data/shared`——按用户要求用英文。

## 行动指南

### 主题行动指南

#### 背景

有线拓扑已通，共享存储节点对外提供若干共享；多台客户端要把这些共享当本地磁盘用，并且以后还会不断有「全家共用」的新材料。

#### 核心问题

如何在各客户端对齐映射，又避免每新建一个独立共享就全网人工补挂——需要可重复的挂载验收，以及「少建独立共享、多用约定子目录」的产品化约定。

#### 核心解决方案

按顺序做：

1. 确认客户端能到达存储节点的约定触点（优先有线局域网；有线不通时可临时经组网触点，并记为技术债）。不做：把临时组网挂载当成最终态而不记迁回。
2. 在各端按同一共享清单完成持久映射或开机自动挂载，并逐项验收「能当磁盘用」。
3. 新材料默认放进已有大共享下的约定子目录，而不是先开独立共享。相关可选项：浏览即用 / 开机自动挂 / 清单脚本 / 少建共享用子目录——日常共用认第 4 种；独立共享仅在权限或备份隔离时用。
4. 仅当权限或备份策略要求隔离时，才新建独立共享，并**同时**在各端补挂。不做：指望存储系统新建后客户端自动出盘符。
5. 有线恢复后，把临时经组网的挂载迁回局域网触点。
6. 复电或排障时区分「端口通」与「已挂载」，缺挂载则回到固定恢复 / 挂载检查。

#### 验收标准

以后按本主题执行时，下列全部成立才算完成：

- 约定客户端上，清单内共享均可当磁盘读写（或只读策略下可读）。
- 新共用材料有统一入口（约定子目录），不必为每次共用新建独立共享。
- 若曾用组网触点临时代挂，有线恢复后已迁回局域网触点（或明确仍属技术债及迁回计划）。
- 复电后关键挂载能通过固定检查，不只是端口探测通过。

### 细节与其他

#### 若有新材料要全家共用

则：优先丢进 `data/shared/{docs,downloads,tmp,media}/...`。

- Win：`N:\shared`
- Mac：`~/NAS/data/shared`
- GTR：`/mnt/nas/data/shared`

不做：为每次共用新开独立 UGOS 共享。

#### 若必须新开独立共享

则：

1. 先确认真需要隔离权限 / 备份策略，并接受须三端同时补挂。
2. 同时改 Win 映射、Mac `~/NAS`、GTR fstab。
3. 不要指望 UGOS 新建后客户端自动出盘符。
4. 参考当晚 `photos`：Win `R:` / Mac `~/NAS/photos` / GTR `/mnt/nas/photos`。

相关可选项：只浏览不映射——可以临时用，但不替代持久映射验收。

#### 若 Mac 有线恢复

则：确认 Mac 有线 ping 与 445 已通后，把 SMB 从 `〈TS:nas〉` 迁到 `〈LAN:nas〉`。不做：有线已通仍长期走组网触点。

#### 若 GTR 复电后盘没有

则：确认已进 Ubuntu；查 `/etc/nas-smb.cred`（只记路径）与 `~/bin/minigtr-recover.sh`。「445 通」不等于「已挂载」。

#### 若核对三端现状

则：参见下方挂载速查表；Windows 当晚盘符为 `N:` data、`P:` projects、`O:` docker、`Q:` personal_folder、`R:` photos。

## 补充说明

### 挂载速查（脱敏）

| 共享 | Windows | Mac mini | mini GTR |
|---|---|---|---|
| data | `N:` | `~/NAS/data`（经 TS） | `/mnt/nas/data` |
| projects | `P:` | `~/NAS/projects` | `/mnt/nas/projects` |
| docker | `O:` | `~/NAS/docker` | `/mnt/nas/docker` |
| personal_folder | `Q:` | `~/NAS/personal_folder` | `/mnt/nas/personal_folder` |
| photos | `R:` | `~/NAS/photos` | `/mnt/nas/photos` |
| 通用 | `N:\shared` | `~/NAS/data/shared` | `/mnt/nas/data/shared` |

- 精确 UNC → 本地协作目录 by-agent。交叉：网段与网关 → [主题 03](../2026-09-26--%E4%BA%A4%E6%8D%A2%E6%9C%BA%E9%87%8D%E5%BB%BA%E5%B1%80%E5%9F%9F%E7%BD%91-%E6%97%A0%E8%B7%AF%E7%94%B1%E5%99%A8-GTR%E7%BD%91%E5%85%B3/index.md)；复电挂载检查 → [主题 01](../2026-09-26--minigtr%E6%96%AD%E7%94%B5%E6%81%A2%E5%A4%8D-UPS%E9%80%89%E5%9E%8B-%E9%BB%98%E8%AE%A4Ubuntu%E5%BC%80%E6%9C%BA/index.md)。
- 来源对话：IT资产管理，约 23:45–23:55。
