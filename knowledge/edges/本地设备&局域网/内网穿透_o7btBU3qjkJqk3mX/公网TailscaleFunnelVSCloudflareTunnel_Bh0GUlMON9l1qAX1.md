# 公网 Tailscale Funnel VS Cloudflare Tunnel

- [一、核心对比表](#%E4%B8%80%E6%A0%B8%E5%BF%83%E5%AF%B9%E6%AF%94%E8%A1%A8)
- [二、流量流程对比（Flowchart）](#%E4%BA%8C%E6%B5%81%E9%87%8F%E6%B5%81%E7%A8%8B%E5%AF%B9%E6%AF%94flowchart)
  * [1️⃣ Tailscale Funnel 流程](#1%EF%B8%8F%E2%83%A3-tailscale-funnel-%E6%B5%81%E7%A8%8B)
  * [2️⃣ Cloudflare Tunnel 流程](#2%EF%B8%8F%E2%83%A3-cloudflare-tunnel-%E6%B5%81%E7%A8%8B)
- [三、本质差异（非常关键）](#%E4%B8%89%E6%9C%AC%E8%B4%A8%E5%B7%AE%E5%BC%82%E9%9D%9E%E5%B8%B8%E5%85%B3%E9%94%AE)
  * [Funnel 是：](#funnel-%E6%98%AF)
  * [Cloudflare Tunnel 是：](#cloudflare-tunnel-%E6%98%AF)
- [四、从“内网穿透模型”角度比较](#%E5%9B%9B%E4%BB%8E%E5%86%85%E7%BD%91%E7%A9%BF%E9%80%8F%E6%A8%A1%E5%9E%8B%E8%A7%92%E5%BA%A6%E6%AF%94%E8%BE%83)
- [五、架构分层对比](#%E4%BA%94%E6%9E%B6%E6%9E%84%E5%88%86%E5%B1%82%E5%AF%B9%E6%AF%94)
    + [Tailscale Funnel](#tailscale-funnel)
    + [Cloudflare Tunnel](#cloudflare-tunnel)
- [六、工程决策逻辑](#%E5%85%AD%E5%B7%A5%E7%A8%8B%E5%86%B3%E7%AD%96%E9%80%BB%E8%BE%91)
- [七、从攻击面看](#%E4%B8%83%E4%BB%8E%E6%94%BB%E5%87%BB%E9%9D%A2%E7%9C%8B)
- [八、抽象总结](#%E5%85%AB%E6%8A%BD%E8%B1%A1%E6%80%BB%E7%BB%93)

---



目标：  
**对公网暴露内网服务（无端口映射）**

两者都不是“暴露内网 IP”。  
它们做的是：**反向隧道（reverse tunnel）+ 中央控制面转发。**

但层级完全不同。

---

# 一、核心对比表
| 维度 | Tailscale Funnel | Cloudflare Tunnel |
| --- | --- | --- |
| 本质定位 | Overlay 网络上的公网入口功能 | 全球边缘网络的反向隧道入口 |
| 依赖体系 | Tailscale tailnet | Cloudflare 边缘网络 |
| 内网穿透方式 | 通过已建立的 WireGuard 隧道 + DERP 中继 | 通过 cloudflared 与 Cloudflare Edge 建立长连接 |
| 公网入口在哪里 | Tailscale DERP 节点 | Cloudflare 全球 Anycast 边缘 |
| 是否需要域名 | 可选（默认 ts.net） | 必须有域名 |
| 是否有 CDN | 无 | 有 |
| 是否有 WAF | 基本没有 | 有 |
| 生产级能力 | 轻量级 | 工业级 |
| 并发能力 | 受限 | 可扩展 |
| 典型用途 | demo、webhook 测试、小工具 | 长期公网 API、服务入口 |
| 控制面核心 | 设备身份 + tailnet ACL | 域名 + Zero Trust 策略 |


---

# 二、流量流程对比（Flowchart）
## 1️⃣ Tailscale Funnel 流程
```plain
[公网用户]
        ↓ HTTPS
[Tailscale 公网 DERP 节点]
        ↓ (Overlay 转发)
[已建立的 WireGuard 隧道]
        ↓
[你的机器]
        ↓
[localhost:3000]
```

关键机制：

+ 你的机器主动连入 tailnet
+ Funnel 让 DERP 节点接受公网流量
+ 流量走现有加密隧道回到你机器

特点：

✔ 没有端口映射  
✔ 没有公网 IP 暴露  
✔ 入口在 Tailscale 网络

---

## 2️⃣ Cloudflare Tunnel 流程
```plain
[公网用户]
        ↓ HTTPS
[Cloudflare 全球边缘]
        ↓
[Cloudflare Tunnel]
        ↓
[cloudflared 长连接]
        ↓
[你的机器]
        ↓
[localhost:3000]
```

关键机制：

+ cloudflared 主动连到 Cloudflare
+ Cloudflare 把公网流量通过 tunnel 送回
+ 所有入口发生在 Cloudflare 边缘

特点：

✔ 没有端口映射  
✔ 没有公网 IP 暴露  
✔ 入口在 Cloudflare CDN 层

---

# 三、本质差异（非常关键）
## Funnel 是：
> 在“私网 Overlay 网络”上临时打开一个公网入口
>

它的主战场是：

Tailnet 内部互联。

公网暴露只是附加能力。

---

## Cloudflare Tunnel 是：
> 专门为“公网服务暴露”设计的边缘入口系统
>

它的主战场是：

互联网边缘。

---

# 四、从“内网穿透模型”角度比较
传统端口映射：

```plain
公网 IP → 路由器 → 内网机器
```

攻击面大。

现代反向隧道：

```plain
机器主动出站 → 建立长连接 → 公网通过该连接回流
```

两者都属于第二种。

但：

Tailscale = Overlay 网络优先  
Cloudflare = Edge 网络优先

---

# 五、架构分层对比
### Tailscale Funnel
```plain
[Internet]
    ↓
[Tailscale Relay]
    ↓
[Tailnet Overlay]
    ↓
[Local Service]
```

### Cloudflare Tunnel
```plain
[Internet]
    ↓
[Cloudflare Edge CDN]
    ↓
[Tunnel]
    ↓
[Local Service]
```

---

# 六、工程决策逻辑
如果你问：

“我要长期对公网开放 AI API / webhook / NAS Web UI”

答案非常直接：

用 Cloudflare Tunnel。

如果你问：

“我只是想测试一个 webhook 是否能打进来”

用 Funnel。

---

# 七、从攻击面看
Funnel 的公网入口能力相对简单：

+ 没有成熟 WAF
+ 没有完整 Bot 防护
+ 没有高级访问控制

Cloudflare Tunnel 具备：

+ 全球边缘
+ WAF
+ DDoS 防护
+ Access Policy
+ Rate Limit

你现在在做 NAS + AI infra。

如果服务是长期存在的公网入口，  
Funnel 不应该成为你的正式边界。

---

# 八、抽象总结
两者做的都是：

“反向隧道内网穿透”。

区别在于：

谁控制公网入口那一层。

Funnel 让 Tailscale 控制入口。  
Cloudflare 让全球 CDN 控制入口。

这就是“控制面设计”的差异。

---

如果你愿意，我可以给你画一个：

+ 私网访问（SSH）
+ 公网 API
+ Webhook
+ NAS 管理界面
+ AI 服务

的完整分层架构图，把攻击面压到最小。



> 更新: 2026-02-19 15:52:56  
> 原文: <https://www.yuque.com/viruspc/el3mi0/dswmgck503tpn7ks>