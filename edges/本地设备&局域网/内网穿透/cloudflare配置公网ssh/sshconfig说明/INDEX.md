# ssh config 说明

- [1. `Host macmini-ssh`](#1-host-macmini-ssh)
- [2. `HostName macmini-ssh.viruspc.tech`](#2-hostname-macmini-sshviruspctech)
- [3. `ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h`](#3-proxycommand-opthomebrewbincloudflared-access-ssh---hostname-%25h)
- [4. `User mock_user_name`](#4-user-mock_user_name)
- [5. `ServerAliveInterval 60` 与 `TCPKeepAlive yes`](#5-serveraliveinterval-60-%E4%B8%8E-tcpkeepalive-yes)
- [6. `ControlMaster` 与 `ControlPersist` (建议添加)](#6-controlmaster-%E4%B8%8E-controlpersist-%E5%BB%BA%E8%AE%AE%E6%B7%BB%E5%8A%A0)
- [总结：配置前后的对比](#%E6%80%BB%E7%BB%93%E9%85%8D%E7%BD%AE%E5%89%8D%E5%90%8E%E7%9A%84%E5%AF%B9%E6%AF%94)

---

在 SSH 的体系中，`~/.ssh/config` 就像是一个“拨号快捷键”和“协议转换器”。当你针对 **M3 Mac mini** 进行配置时，每一行参数都解决了特定的网络障碍。

以下是该配置各部分的详细拆解：

### 1. `Host macmini-ssh`

* **作用**：定义一个**别名**。
* **解释**：这让你以后不再需要输入长串的域名。只需在终端输入 `ssh macmini-ssh`，SSH 客户端就会自动匹配下方的所有参数。

***

### 2. `HostName macmini-ssh.viruspc.tech`

* **作用**：指向真实的**目标地址**。
* **解释**：这是你在 Cloudflare Zero Trust 控制面板中为 Tunnel 分配的域名。

***

### 3. `ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h`

这是整个配置的**核心灵魂**。

* **作用**：将 SSH 流量重定向到 **Cloudflare 隧道**。
* **工作原理**：

1. 普通的 SSH 连接（TCP 22）无法穿透 Cloudflare 的防火墙。
2. `ProxyCommand` 告诉 SSH 客户端：*“嘿，不要自己去连目标，去调用这个路径下的 *`cloudflared`* 工具”*。
3. `cloudflared` 会建立一个加密的 **WebSocket** 通道。
4. `%h` 是一个占位符，会自动替换为上面的 `HostName`。

* **路径细节**：由于你是 **M3 芯片**，Homebrew 的软件安装在 `/opt/homebrew/bin/` 下，必须写全路径，SSH 才能在不加载完整环境变量的情况下找到该命令。

***

### 4. `User mock_user_name`

* **作用**：预设**登录用户名**。
* **解释**：由于你的本地用户是 `mock_user_name`，预设后你就不再需要写成 `ssh mock_user_name@...`，直接 `ssh macmini-ssh` 即可。

***

### 5. `ServerAliveInterval 60` 与 `TCPKeepAlive yes`

* **作用**：维持**隧道活性**。
* **解释**：
* Cloudflare 和你家里的路由器可能会在长时间没有数据传输时断开连接。
* 这两行配置会让你的客户端每 60 秒给 Mac mini 发一个“心跳包”，防止你正在查看 **LangChain** 日志或 **n8n** 部署状态时连接无故断开 \[cite: 2026-02-14]。

***

### 6. `ControlMaster` 与 `ControlPersist` (建议添加)

虽然这是进阶配置，但对你很有用：

* **作用**：**连接复用**。
* **解释**：当你已经在终端连着 SSH 时，如果你又在 **Cursor** 或 **VS Code** 里打开了同一个项目，它会**重用**已经建立好的隧道，而不需要重新进行 Cloudflare 的浏览器身份验证。这大大提升了多窗口作业的体验。

***

### 总结：配置前后的对比

| 特性 | 未配置前 | 配置后 |
| --- | --- | --- |
| **连接命令** | `ssh mock_user_name@macmini-ssh.viruspc.tech` | `ssh macmini-ssh` |
| **穿透能力** | 被防火墙拦截，无法连接 | **成功穿透**（通过 WebSocket 隧道） |
| **身份验证** | 只有 SSH 密码/Key | **双重保险**（CF 登录 + SSH 登录） |
| **稳定性** | 容易因闲置超时掉线 | **持久在线**（心跳包维持） |

**既然现在 SSH 别名已经配好，你想让我教你如何把 Mac mini 的 22 端口彻底从本地防火墙关掉，只允许 Cloudflare 隧道进入吗？**


> 更新: 2026-02-20 09:44:39  
> 原文: <https://www.yuque.com/viruspc/el3mi0/xo0uim1pcbc5tsso>