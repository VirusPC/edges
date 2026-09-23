# minigtr ↔ 绿联 NAS 阶段性收口（脱敏）

来源：minigtr设备助手转述；peng cheng 要求重新总结进 edges（2026-09-23）。  
交叉：`knowledge/notes/2026-09-20--机械师Mini-GTR-Ubuntu双系统安装.md`

**不含密码 / 密钥。**

## 结论（当前可用形态）

绿联 NAS（DXP4800PLUS）经有线直连挂在 minigtr 上，走 `nas-link` 共享网段上网；日常文件用 SMB 挂载；远程管理优先 Tailscale。厂商公网远程建议关掉。未改分区 / EFI。

## 网络

- NAS **DXP4800PLUS** 直连 minigtr **`eno1`**
- `nas-link` shared：minigtr **`10.42.0.1/24`**，NAS **`10.42.0.223`**
- NAS 上网经 minigtr **NAT**
- **勿**让 NAS 上企业 Wi‑Fi（避免旁路/双出口搅乱）

## SMB

- 分享映射到本机：`data` / `projects` / `docker` / `personal_folder` → `/mnt/nas/...`
- 凭证文件：`/etc/nas-smb.cred`（本笔记不记内容）
- 日常用户：**`cheng`**（非 admin）

## 管理入口

- 曾用临时方案：minigtr **`socat 19443→9443`** 转发管理页；**现优先 Tailscale**
- `socat` 仍可能临时启用，不作默认路径

## Tailscale

- NAS 已装 **1.96.4**，服务在跑
- 已授权接回：节点名 **`nas`** / **`100.77.6.72`**
- 应用中心「无包」属正常现象
- `docker/tailscale` compose **仅为备选**，不是当前主路径

## SSH

- 入口：`ssh cheng@nas`
- **多次失败会 IP 封锁**；解封后可用
- **勿盲目连打**

## 未做 / 刻意不做

- 未改分区 / EFI
- 厂商公网远程：**建议关掉**
- `socat` 临时转发：可留作应急，不依赖为常驻

## How to apply

- 日常：SMB 读写 `/mnt/nas/...`；管理与 SSH 走 Tailscale 主机名 `nas`
- 排障先查：`eno1` / `nas-link` 是否在、`10.42.0.223` 是否通、是否误连企业 Wi‑Fi、SSH 是否因失败封锁
- 需要公网式管理时优先 Tailscale，不要默认开厂商远程或长期依赖 socat
