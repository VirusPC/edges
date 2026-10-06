# Grok Bot 云电脑与 Tailscale 互通实践

> Ingested on 2026-09-05
>
> 本文为通用方法论与实践记录，已移除 Tailscale 账号标识、具体 CGNAT/内网地址、授权链接与机器序列号等可定位个人环境的细节。

【讨论主题】
围绕 Grok Bot 自带的 Linux 云电脑：摸清硬件与成本、确认无公网 IP 但仍可出站，随后用 Tailscale 做内网穿透；并延伸讨论如何访问 tailnet 中其他设备（手机、Mac、阿里云 ECS），以及把整段对话整理进公开知识库 edges。

【主要结论】
(事实与共识)

- 云电脑为 KVM Debian 虚拟机：约 8 核 Xeon（对外显示 Family 6 Model 207 / Emerald Rapids 切片）、16GB 内存、约 128GB 盘、无独立 GPU、无 Swap。
- 网卡仅有内网地址，无公网 IP / EIP；出站经 NAT 可用（HTTPS/DNS 正常），外网不能直连进来。
- 同等「能跑活」的物理机（迷你主机 / 办公小主机）约人民币 3500–4200；若按可见的整颗大缓存至强去买服务器主机，量级约 8–13 万。
- 阿里云接近规格的计算型实例（如 c8i 8C16G）包月含盘与小带宽大约九百元量级；包年摊薄更低；经济型共享实例更便宜但无同级性能承诺。
- 已在云电脑安装 Tailscale，节点加入个人 tailnet；因环境无 systemd，守护进程需手动拉起，整机重置后要重启。
- 云电脑未装 OpenSSH、公网无 22；可开启 Tailscale SSH，用 tailnet 身份登录本机用户（云电脑侧为 `box`，该账号口令为锁定状态，不走密码）。
- Grok Bot 可登记多台用户电脑做本地执行；当时仅登记一台 MacBook Pro，且曾出现名单显示已连接但实际命令不可达。未登记的 Mac mini 不可被本地执行操控。
- Tailscale 互通 ≠ 可遥控设备：对 iPhone，网络可达也不等于能操作备忘录等 App；原版 iOS 无系统级 SSH。
- 阿里云 ECS 节点在 tailnet 上可 ping 通，OpenSSH 22 开放；无阿里云官方连接器时看不到控制台账单/监控。最终约定：只用 Tailscale SSH、以业务用户（非 root、非云电脑本地 `box`）登录 ECS。
- Tailscale ACL 决定允许登录的「目标机本地用户名」；源机器上的用户名不能直接套用到目标机。

【认知更新】
(洞察与 Edge 雏形)

- 云上 8 vCPU 往往是大核数至强上的切片：L3 等资源看起来「夸张」，并不等于能买到一颗同规格的 8 核零售 CPU；成本对比要分「等价算力」与「等价硅片」两层。
- Tailscale 的价值是私网通道与身份：解决「怎么安全连上」，不解决「怎么替你点 App」。手机适合当入口，Mac/Linux 才适合当被控端与脚本主机。
- 对 Agent 而言：登记本地电脑 = 可批准后跑命令/读写文件；仅 Tailscale 在线 = 网络层可达。两套能力不要混为一谈。
- 投递箱 + Tailscale Serve（仅 tailnet 可见）比把云电脑当 exit node 或强行遥控手机更贴近日常。

【行动指南】
(决策与后续动作)

- 访问云电脑：在已登录 Tailscale 的设备上使用 Tailscale SSH（本机用户为 `box`），不要依赖公网 22 或密码。
- 访问阿里云 ECS：固定使用 Tailscale SSH + 指定业务用户；不要用 root、不要改走普通 SSH，除非另行约定。
- 需要 Agent 操控某台 Mac：在 Grok Bot 设置中登记该机并保持本地执行在线。
- 若要「手机驱动云电脑」：优先 Shortcuts / 网页 / SSH 客户端打到云电脑或 Serve 页面，而不是给 iPhone 开系统 SSH。
- 候选落地：在云电脑做仅 tailnet 可见的私人投递箱（链接/文件丢入后后台下载归档）。
- 云电脑重置后记得重装/重拉 Tailscale 守护进程。

【补充说明】
(其他重要细节或备注)

- 对话时间线约 2026-08-31 至 2026-09-05；含群聊「通用复杂任务」中对穿透后续用法的脑暴。
- 云电脑侧曾出现 connmark 内核模块缺失警告，不影响常规互访。
- 部分 peer 会显示离线或节点密钥过期；iOS 设备常因休眠短暂 offline，需复测再下结论。
- MacBook 上曾观察到多类本地 Agent 进程（Claude CLI、Codex、Cursor worker、OpenClaw、Grok Bot 等）；Cursor 云端 agent 当时无正在跑任务。
- edges 入库路径约定：对话笔记经 `conversation-to-notes` 整理后进入 `knowledge/notes/`；公开仓库写入前需脱敏。

【相关链接】
- Tailscale 安装与文档：https://tailscale.com/docs/
- 阿里云计算型实例规格族说明：https://help.aliyun.com/zh/ecs/user-guide/compute-optimized-instance-families
- 阿里云 ECS 定价页（静态页不完整，下单以控制台为准）：https://cn.aliyun.com/price/detail/ecs
- Grok Bot 本地电脑设置（应用内）：`grokbot://app/v1/settings?id=computers`
