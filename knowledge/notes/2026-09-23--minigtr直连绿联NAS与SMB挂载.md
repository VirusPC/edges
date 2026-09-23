【背景】

要把一台原先在家里用过的绿联 NAS，接到家用 Ubuntu 主机 minigtr 上：先打通访问与上网，再决定是否进同一 Wi‑Fi，最后把 NAS 共享目录挂到 minigtr，方便当网络盘存取。顺带厘清厂商远程访问、Tailscale、以及用管理员账号挂载的风险。

同一天后半段把这条链路收成当前可用形态：SMB 改由专用用户挂载，Tailscale 接回原来的身份，SSH 解封后可以登录，管理页优先走 Tailscale 主机名。分区和 EFI 不动。

后来从别的机器走 Tailscale 时，客户端显示已经 Connected，但对端连不上它报出的 IPv4。下面各栏补上这次现象、排除项和临时修复。口令仍不入库。

【过程】

网线直连 minigtr 有线口后，口上有链路但起初没有地址。因对面没有路由器 DHCP，在 minigtr 上对该口启用 NetworkManager「共享」模式，由主机分配私网并做 NAT；随后发现绿联 NAS（型号约 DXP4800PLUS），管理页、SSH、SMB 等端口可达。

曾考虑让 NAS 加入与 minigtr 相同的企业 Wi‑Fi（WPA2 Enterprise / 802.1X）。该网络需账号密码式企业认证，绿联对这类认证支持弱，且个人 NAS 挂企业无线存在合规问题，故未走这条路。

NAS 上以前在家里装过 Tailscale，主机名仍是历史设备名，但长时间离线；搬迁直连后需重新出网并在管理页唤醒客户端，而不是当新设备重注册。Mac 无法直接打开直连网段里的管理地址，SSH 本地端口转发未成功；改为在 minigtr 上用 socat 做 TCP 原样转发，经主机在私有组网中的入口打开 NAS 管理页。用户反馈厂商「远程访问 / 旧公网入口」仍可用；在当前接法下，NAS 出站实际仍经 minigtr 上网。

挂载选型上对比了 SMB 与 NFS：NAS 已开 SMB、未开 NFS。用管理员用户做 SMB 登录时一度因密码错误失败，更正后列出共享（含 data、projects、docker、个人目录等）。在 minigtr 上将上述共享挂到 `/mnt/nas/...`，凭证单独落盘且权限收紧，并写入开机自动挂载（网络未就绪时不阻断启动）。随后讨论了继续用管理员账号挂载的权限与凭证落盘风险。

收口时，SMB 已从管理员改为专用用户 `cheng`。凭证文件是 `/etc/nas-smb.cred`，只记路径，不记内容。四个共享挂在 `/mnt/nas/data`、`/mnt/nas/projects`、`/mnt/nas/docker`、`/mnt/nas/personal_folder`，并由 fstab 做 automount。

应用中心没有 Tailscale 包，这是正常现象。NAS 上本已安装 Tailscale 1.96.4，systemd 服务也在跑，只是未登录。授权后接回原身份：主机名 `nas`，Tailscale IP `100.77.6.72`。minigtr ping 该地址大约 1ms。曾准备 `docker/tailscale/docker-compose.yml`，作为当时没有 SSH 时的备选；当前主路径是系统服务，不必再走 Docker。

SSH 多次失败认证后，管理把来源 IP 锁住了，来源多为直连网关侧。解封后 `cheng` 可以登录。当时日常用 `ssh cheng@nas` 或 `ssh cheng@100.77.6.72`。不要连续盲打。管理页的管理员用户，和 SSH、SMB 账号的权限并不完全等同。Mac 上短名 `nas` 后来发现可能指错机器，见下面 Tailscale IPv4 一节。

管理页曾用临时 socat 做 `19443→9443`，只适合应急。收口时优先打开 `https://nas:9443` 或 `https://100.77.6.72:9443`。短名后来在 Mac 上不可靠，当前优先 `nas.tail45bfa4.ts.net` 或 `100.77.6.72`。socat 可能不是常驻进程。

网络没有改：NAS 仍接 minigtr 的 `eno1`，连接名 `nas-link`，模式为 shared；minigtr 是 `10.42.0.1/24`，NAS 是 `10.42.0.223`，NAS 出网经 minigtr NAT。不要让 NAS 上企业 Wi‑Fi。

没有改分区，也没有动 EFI。厂商公网远程建议关掉，远程只留 Tailscale。

### Tailscale 报了 100.77.6.72，tailscale0 上却没有这条 IPv4

收口之后，从对端走 Tailscale 访问这台绿联 NAS（UGOS）时又出过一次故障。Tailscale 自己报 Connected，主机名 `nas`，IP `100.77.6.72`，TUN=true。同一时刻在 NAS 上执行 `ip addr show tailscale0`，接口上只有链路本地 IPv6，没有 `100.77.6.72`。

因此 Tailscale 自带的 ping 可以通，但从对端对 `100.77.6.72` 的 TCP 22 和 9443 超时。局域网地址 `10.42.0.223` 的 22 和 9443 仍然通。sshd 当时已经在 `0.0.0.0` 上监听。

排除过的方向有三件，都不是这次的原因：应用中心缺 Tailscale 包、授权失败，以及把局域网地址 `10.42.0.223` 配到 `tailscale0` 上。

Mac 上还有一层名字问题：短名 `nas` 可能经公司 DNS 解析到 `nas.xiaohongshu.sh`。要访问这台 NAS，用 `nas.tail45bfa4.ts.net` 或 `100.77.6.72`。

当时恢复连通的命令是 `ip addr add 100.77.6.72/32 dev tailscale0`。加上之后，经 Tailscale 的 SSH 和 HTTPS 恢复。为了重启后还在，加了 systemd oneshot `tailscale-ipv4-fix.service`，`After=tailscaled.service`，由它调用 `/usr/local/sbin/tailscale-ipv4-fix.sh`。

根因没有完全证实。比较像是 UGOS 的网络配置干扰了地址下发，或者 Tailscale 进程里的状态和主机协议栈不一致。手工能把地址加上，说明内核允许这条地址存在。

【所学】

直连线不等于「已经在同一局域网」：没有 DHCP 时，需要一端共享上网或双方静态地址，否则只能看到链路、访问不到服务。

「能登 NAS 网页」不等于「同一套账号一定能 SMB」；协议层登录失败应先核对文件共享用户与 SMB 开关，而不是先怀疑挂载命令。

企业 802.1X Wi‑Fi 不适合想当然塞给消费级 NAS；要同网段访问，优先直连/家用路由，或私有组网客户端，而不是硬接企业无线。

厂商远程访问与自建私有组网是两套通道：前者方便，但流量与暴露面要单独评估；在「只经某台主机上网」的拓扑下，远程通着也仍经过那台主机的出口。

SMB 更适合 NAS + Linux + 偶尔 Mac 的组合；NFS 的跨系统难点主要在 uid/gid 身份模型与客户端成熟度，而不是「绝对连不上」。

用管理员账号挂整盘，等于扩大了主机上任意能写挂载点的进程的爆破面；家庭单人可用，长期更稳妥的是专用低权限挂载用户。

连续失败的 SSH 会锁来源 IP。锁上之后继续连打不会把门锁开，只会让封锁更久。

装过 Tailscale 不等于已经加入 Tailnet。Needs login 表示安装和服务都可以是好的，节点对网内仍然是离线的。

应用中心没有对应安装包，也不等于软件没装。它可能装在商店之外，缺的只是登录。

管理页管理员、SSH 用户、SMB 用户是三套权限。网页能打开，不说明这一个身份就该拿来挂盘或远程登录。

Tailscale 状态行里的 Connected、IP 和 TUN=true，只代表客户端这么报告，不代表内核已经把这条 IPv4 配在 `tailscale0` 上。它自己的 ping 能通，也不代表对端用 TCP 去连报出来的 100.x 地址就能通。

对端访问 100.x 的 22 和 9443 超时、局域网同端口却通、sshd 又在 `0.0.0.0` 监听时，问题在 Tailscale 地址有没有进主机接口，不在 SSH 没起来，也不在应用中心没包或还没登录。

缺的是 Tailscale 报出的那条 100.x。把直连网段的 `10.42.0.223` 挪到 `tailscale0` 上，对不上对端要连的地址。

短名 `nas` 在走公司 DNS 的 Mac 上不能当成这台 NAS。它可能指到 `nas.xiaohongshu.sh`。Tailnet 里这台机器的名字是 `nas.tail45bfa4.ts.net`，或者直接用 `100.77.6.72`。

手工 `ip addr add` 能恢复，说明当时内核并不拒绝这个地址。所以更像地址没被交到接口上，而不是内核禁止 Tailscale。UGOS 干扰，和进程状态与协议栈不一致，都还只是可能，这次没有证死。

【行动指南】

若再把存储设备网线直连 Linux 主机且对端无路由器：则先确认物理链路，再对该网口用「共享/链接本地/静态」之一赋址，用探测确认管理页与 SMB 端口后再谈挂载。

若需要在笔记本浏览器打开仅主机能访问的 NAS 管理页：则优先在主机上做 TCP 转发或子网路由，并验证本机监听/连通；不要假设「输过 SSH 密码就等于隧道已建立」（仅转发、无 shell 时窗口会像卡住，但若本机端口未监听则隧道实际未成功）。

若要把 NAS 当 minigtr 上的普通目录：则优先开 SMB，用凭证文件 + fstab/`_netdev`/`nofail`（或等价 automount）挂到固定路径；NFS 仅在明确只要 Linux 且愿意维护导出与 uid 映射时再开。

若挂载账号又变回管理员，或另一台主机要按今天的方式挂：则改用专用用户 `cheng`，凭证只放在 `/etc/nas-smb.cred`，用 fstab automount 挂到 `/mnt/nas/data`、`/mnt/nas/projects`、`/mnt/nas/docker`、`/mnt/nas/personal_folder`，不要把口令写进仓库或 fstab 明文。

若 SSH 连续认证失败：则马上停手，先确认是不是直连网关侧 IP 被管理锁封锁；解封后再执行一次 `ssh cheng@nas.tail45bfa4.ts.net` 或 `ssh cheng@100.77.6.72`，不要盲打。不要用短名 `nas`，它在 Mac 上可能经公司 DNS 指到 `nas.xiaohongshu.sh`。

若应用中心找不到 Tailscale，但期望 NAS 已在网上：则先看 systemd 是否已在跑、状态是不是 Needs login。是的话给现有的 1.96.4 授权，接回主机名 `nas`，不要当成新设备重装。只有 SSH 不可用、系统服务也起不来时，才动已经准备过的 `docker/tailscale/docker-compose.yml`。

若要打开管理页：则优先 `https://nas.tail45bfa4.ts.net:9443` 或 `https://100.77.6.72:9443`。只有这个入口暂时不可达时，才临时用 socat 把 `19443` 转到 `9443`，并默认这次转发不会一直留着。短名 `https://nas:9443` 只在已经确认它解析到这台 NAS 时再用。

若有人要把 NAS 改上企业 Wi‑Fi，或顺手改分区 / EFI：则维持 `eno1` 直连、`nas-link` shared、`10.42.0.1/24` 与 NAS `10.42.0.223`、经 minigtr NAT；分区和 EFI 都不动。

若厂商公网远程还开着：则关掉，远程只留 Tailscale。

若 NAS 曾在其他网络用过私有组网客户端：则搬迁后先保证出站网络，再在 NAS 应用内重连同一身份，而不是急着新增一台设备。

若 Tailscale 对端显示在线，但连 `100.x` 的 22 或 9443 超时，而局域网 IP 的同样端口是通的：则在 NAS 上执行 `ip -4 addr show tailscale0`。若看不到 100.x，就执行 `ip addr add 100.77.6.72/32 dev tailscale0`，或确认 oneshot `tailscale-ipv4-fix.service` 已启用，并且会在 `tailscaled.service` 之后调用 `/usr/local/sbin/tailscale-ipv4-fix.sh`。不要把 `10.42.0.223` 配到 `tailscale0`，也不要为此重装应用中心的包或重新登录。

若在 Mac 上用短名 `nas` 做 SSH 或打开管理页，结果去了别的机器：则改用 `nas.tail45bfa4.ts.net` 或 `100.77.6.72`。短名可能经公司 DNS 指到 `nas.xiaohongshu.sh`。

【补充说明】

- 当前挂载：`/mnt/nas/data`、`/mnt/nas/projects`、`/mnt/nas/docker`、`/mnt/nas/personal_folder`；协议 SMB3；账号 `cheng`；凭证路径 `/etc/nas-smb.cred`，仅 root 可读，口令不入库。
- 直连地址：minigtr `eno1` 上的 `nas-link` shared 为 `10.42.0.1/24`，NAS 为 `10.42.0.223`，出网走 minigtr NAT。
- Tailscale：NAS 已装 1.96.4，主机名 `nas`，地址 `100.77.6.72`；minigtr ping 约 1ms。`docker/tailscale/docker-compose.yml` 只是无 SSH 时的备选，不是当前主路径。客户端报出地址时，仍要看 `tailscale0` 上有没有这条 IPv4。
- Tailscale IPv4 曾缺在接口上：客户端报 Connected、`100.77.6.72`、TUN=true，但 `ip addr show tailscale0` 只有链路本地 IPv6。对端 TCP `100.77.6.72:22` 与 `:9443` 超时；`10.42.0.223:22` 与 `:9443` 正常；sshd 监听 `0.0.0.0`。临时修复是 `ip addr add 100.77.6.72/32 dev tailscale0`。常驻用 oneshot `tailscale-ipv4-fix.service` 调用 `/usr/local/sbin/tailscale-ipv4-fix.sh`（`After=tailscaled.service`）。单元和脚本全文不在本仓，口令不入库。
- Mac 上短名 `nas` 可能解析到 `nas.xiaohongshu.sh`；这台 NAS 用 `nas.tail45bfa4.ts.net` 或 `100.77.6.72`。
- 管理页应急：socat `19443→9443`。经主机转发时，浏览器可能对证书主机名报警，属预期。
- 不入库：密码、密钥、邮箱全文、凭证文件内容、企业 Wi‑Fi 的 SSID 与账号。
- 同日文件 [2026-09-23--minigtr与绿联NAS直连收口](./2026-09-23--minigtr与绿联NAS直连收口.md) 只保留跳转，避免和本篇各写一份收口。
- 主机关机与双系统背景见 [2026-09-20--机械师Mini-GTR-Ubuntu双系统安装](./2026-09-20--机械师Mini-GTR-Ubuntu双系统安装.md)。
- 相关概念：SMB/CIFS 为 Windows 风格文件共享；NFS 为 Unix 风格导出；NetworkManager shared 模式会让主机充当简易 DHCP/NAT，便于无路由的两端直连。
- 后续可选：把 Langfuse 等本机服务的备份目录指到 NAS 挂载点；为专用挂载用户轮换凭证；确认厂商公网远程已经关掉。

参考链接：

- [Cloudflare Tunnel 文档（SSH 等非 HTTP 场景）](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/)：讨论过公网 SSH 入口时的背景材料；本次 NAS 未采用该方案。
- [Samba/smbclient 手册思路](https://www.samba.org/samba/docs/)：SMB 列共享与挂载排障的协议侧参考。
