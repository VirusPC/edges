# AI + NAS 基础设施分层模型

- [一、整体分层架构（推荐模型）](#%E4%B8%80%E6%95%B4%E4%BD%93%E5%88%86%E5%B1%82%E6%9E%B6%E6%9E%84%E6%8E%A8%E8%8D%90%E6%A8%A1%E5%9E%8B)
- [二、逻辑分层解释](#%E4%BA%8C%E9%80%BB%E8%BE%91%E5%88%86%E5%B1%82%E8%A7%A3%E9%87%8A)
    + [① 公网入口层（Public Ingress）](#%E2%91%A0-%E5%85%AC%E7%BD%91%E5%85%A5%E5%8F%A3%E5%B1%82public-ingress)
    + [② 应用层](#%E2%91%A1-%E5%BA%94%E7%94%A8%E5%B1%82)
    + [③ 私网管理层](#%E2%91%A2-%E7%A7%81%E7%BD%91%E7%AE%A1%E7%90%86%E5%B1%82)
- [三、流量流程图（Flowchart）](#%E4%B8%89%E6%B5%81%E9%87%8F%E6%B5%81%E7%A8%8B%E5%9B%BEflowchart)
  * [公网 API 访问](#%E5%85%AC%E7%BD%91-api-%E8%AE%BF%E9%97%AE)
  * [私网 SSH 访问](#%E7%A7%81%E7%BD%91-ssh-%E8%AE%BF%E9%97%AE)
  * [Webhook 进入](#webhook-%E8%BF%9B%E5%85%A5)
- [四、为什么这样分层？](#%E5%9B%9B%E4%B8%BA%E4%BB%80%E4%B9%88%E8%BF%99%E6%A0%B7%E5%88%86%E5%B1%82)
- [五、错误示范（不要这样做）](#%E4%BA%94%E9%94%99%E8%AF%AF%E7%A4%BA%E8%8C%83%E4%B8%8D%E8%A6%81%E8%BF%99%E6%A0%B7%E5%81%9A)
- [六、如果用 Tailscale Funnel 会怎样？](#%E5%85%AD%E5%A6%82%E6%9E%9C%E7%94%A8-tailscale-funnel-%E4%BC%9A%E6%80%8E%E6%A0%B7)
- [七、你的最佳组合](#%E4%B8%83%E4%BD%A0%E7%9A%84%E6%9C%80%E4%BD%B3%E7%BB%84%E5%90%88)
- [八、抽象升级（真正核心）](#%E5%85%AB%E6%8A%BD%E8%B1%A1%E5%8D%87%E7%BA%A7%E7%9C%9F%E6%AD%A3%E6%A0%B8%E5%BF%83)

---

**长期可运行的 AI + NAS 基础设施分层模型**。

目标：

+ SSH 私网访问安全
+ OpenClaw / AI API 可公网访问
+ Webhook 可接收
+ NAS 管理面不暴露公网
+ 攻击面最小化

---

# 一、整体分层架构（推荐模型）
```plain
                        ┌────────────────────────┐
                        │        公网用户         │
                        └────────────┬───────────┘
                                     │
                          HTTPS      │
                                     ▼
                        ┌────────────────────────┐
                        │   Cloudflare Edge CDN   │
                        │   (WAF / Rate Limit)    │
                        └────────────┬───────────┘
                                     │
                              Tunnel │
                                     ▼
                        ┌────────────────────────┐
                        │      cloudflared        │
                        │  (反向长连接，出站建立) │
                        └────────────┬───────────┘
                                     │
                      ┌──────────────┴──────────────┐
                      │                             │
                      ▼                             ▼
            [OpenClaw / AI API]           [Webhook Receiver]



────────────────────────────────────────────────────────────


                    （完全隔离的私网访问层）

                      ┌──────────────────────┐
                      │     Tailscale        │
                      │   (Overlay 私网)     │
                      └──────────┬───────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │   NAS / Mac    │
                        │   SSH / Admin  │
                        └────────────────┘
```

---

# 二、逻辑分层解释
我们分成三层：

### ① 公网入口层（Public Ingress）
由 Cloudflare 控制。

职责：

+ TLS 终止
+ WAF
+ Rate Limit
+ Bot 防护
+ Zero Trust 访问控制

特点：

✔ 内网 IP 永远不暴露  
✔ 无端口映射  
✔ 只有 cloudflared 出站连接

---

### ② 应用层
运行：

+ OpenClaw
+ AI API
+ Webhook Receiver

只监听：

```plain
localhost
或
内网地址
```

绝不监听 0.0.0.0:公网。

---

### ③ 私网管理层
由 Tailscale 管理。

职责：

+ SSH
+ NAS 管理界面
+ Docker 控制
+ tmux
+ 日志系统

访问路径：

```plain
你的设备
   ↓
Tailscale 100.x.x.x
   ↓
NAS / Mac
```

完全不经过公网。

---

# 三、流量流程图（Flowchart）
## 公网 API 访问
```plain
Client
  ↓
Cloudflare Edge
  ↓
Tunnel
  ↓
cloudflared
  ↓
localhost:3000
```

## 私网 SSH 访问
```plain
Your Laptop
  ↓
Tailscale Overlay
  ↓
100.x.x.x
  ↓
SSH 服务
```

## Webhook 进入
```plain
3rd Party Service
  ↓
Cloudflare Edge
  ↓
Tunnel
  ↓
Webhook Handler
```

---

# 四、为什么这样分层？
因为你要的是：

长期稳定运行的 AI 基础设施。

那就必须：

+ 公网入口可控
+ 私网访问隔离
+ 管理面不暴露
+ 只有出站连接

攻击面压缩到：

+ Cloudflare 入口
+ Tailscale 身份认证

而不是：

+ 你的路由器
+ 你的端口
+ 你的公网 IP

---

# 五、错误示范（不要这样做）
❌ 路由器端口转发 443 → NAS  
❌ 暴露 SSH 22 端口  
❌ 同时用 Funnel + 端口映射  
❌ NAS 管理面走公网

这叫扩大攻击面。

---

# 六、如果用 Tailscale Funnel 会怎样？
架构会变成：

```plain
公网
  ↓
Tailscale DERP
  ↓
你的节点
```

它没有：

+ 边缘 WAF
+ CDN
+ 高级访问策略

适合 demo，不适合长期生产边界。

---

# 七、你的最佳组合
你现在的环境：

+ NAS
+ OpenClaw
+ AI 服务
+ 长期运行

推荐组合：

公网入口 → Cloudflare Tunnel  
私网管理 → Tailscale  
绝不端口映射

---

# 八、抽象升级（真正核心）
现代安全架构原则：

1. 永远不暴露源 IP
2. 所有入站流量通过“受控入口”
3. 所有管理流量走私网 overlay
4. 所有连接优先出站建立

这叫：

“反向信任模型 + 软件定义边界”。

---

如果你愿意，我可以继续给你设计：

+ 多域名拆分策略
+ API 与 Admin 分离策略
+ AI 服务限流模型
+ NAS 多用户访问隔离模型
+ 或者最小攻击面部署 checklist

网络的终极目标不是连通。  
是可控。



> 更新: 2026-02-17 04:49:47  
> 原文: <https://www.yuque.com/viruspc/el3mi0/scsib7ksp84k3yax>