# cloudflare配置公网 ssh

- [【讨论主题】](#%E8%AE%A8%E8%AE%BA%E4%B8%BB%E9%A2%98)
- [【主要结论】](#%E4%B8%BB%E8%A6%81%E7%BB%93%E8%AE%BA)
- [【行动指南：完整命令清单】](#%E8%A1%8C%E5%8A%A8%E6%8C%87%E5%8D%97%E5%AE%8C%E6%95%B4%E5%91%BD%E4%BB%A4%E6%B8%85%E5%8D%95)
  * [1. 环境修复与安装](#1-%E7%8E%AF%E5%A2%83%E4%BF%AE%E5%A4%8D%E4%B8%8E%E5%AE%89%E8%A3%85)
  * [2. 配置本地 SSH Config](#2-%E9%85%8D%E7%BD%AE%E6%9C%AC%E5%9C%B0-ssh-config)
  * [3. 常用操作命令](#3-%E5%B8%B8%E7%94%A8%E6%93%8D%E4%BD%9C%E5%91%BD%E4%BB%A4)
- [【认知更新】](#%E8%AE%A4%E7%9F%A5%E6%9B%B4%E6%96%B0)
- [【补充说明】](#%E8%A1%A5%E5%85%85%E8%AF%B4%E6%98%8E)

---

PS：

* tailscale 可以客户端不做任何配置直接通过TCP 22连
* 但是由于一些安全策略，普通的 SSH 连接（TCP 22）无法穿透 Cloudflare 的防火墙。需要安装cloudflared工具，再通过加密的websocket连接通信。

2026-02-20--Cloudflare-Tunnel-SSH-详细命令手册.md

***

### 【讨论主题】

完善 Cloudflare Tunnel 在 M3 Mac 客户端的 SSH 连接细节，涵盖安装修复、配置文件编写及常用远程开发指令。

***

### 【主要结论】

* **本地代理路径**：M3 芯片 Mac 的 `cloudflared` 二进制文件标准路径为 `/opt/homebrew/bin/cloudflared`。
* **SSH 配置文件位置**：所有的别名配置必须写入用户家目录下的 `~/.ssh/config` 文件中。
* **认证流程**：首次连接会触发浏览器 OIDC 流程，验证通过后本地会生成短期 Token 供 SSH 使用。

***

### 【行动指南：完整命令清单】

#### 1. 环境修复与安装

如果 `brew` 报错，请依次执行以下命令：

```bash
# 1. 强制清理 Homebrew 的 Git 锁文件
find $(brew --repository) -name "config.lock" -delete 

# 2. 跳过更新直接安装 cloudflared
HOMEBREW_NO_AUTO_UPDATE=1 brew install cloudflared 

```

#### 2. 配置本地 SSH Config

执行 `nano ~/.ssh/config` 并粘贴以下精确配置：

```latex
Host macmini-ssh
    HostName macmini-ssh.viruspc.tech
    # 核心：调用本地二进制文件建立 WebSocket 隧道
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
    User mock_user_name
    # 保持连接，防止因隧道空闲导致的断开
    ServerAliveInterval 60
    TCPKeepAlive yes
    # 自动保存身份信息，减少重复弹窗
    ControlMaster auto
    ControlPath ~/.ssh/ansible-%r@%h:%p
    ControlPersist 30m

```

#### 3. 常用操作命令

* **普通登录**：`ssh macmini-ssh`
* **远程传输文件**：`scp local_file.txt macmini-ssh:/home/mock_user_name/`
* **远程监控资源**（应对之前遇到的内存问题）：`ssh macmini-ssh "btop"` \[cite: 2026-02-14]
* **修复权限**（如遇连接报错）：`chmod 600 ~/.ssh/config`

***

### 【认知更新】

* **双重认证逻辑**：配置完成后，身份验证分为两层：第一层是 Cloudflare 的 Web 登录（Access 策略）；第二层是 Mac mini 本地的 SSH 密码或公钥。
* **IDE 集成优势**：在 Cursor 的 Remote-SSH 中直接指定 `macmini-ssh` 别名，编辑器会自动继承 `ProxyCommand` 配置，无需额外设置。

***

### 【补充说明】

* **服务端健康检查**：由于你在 2 月 14 日曾处理过 Docker 导致的 Mac mini 内存高占用，若 SSH 连接缓慢，请先检查宿主机负载 \[cite: 2026-02-14]。
* **路径注意**：如果后续你通过 `uv` 或其他工具在容器外运行 Python 项目，确保 `cloudflared` 隧道仍然存活。


> 更新: 2026-02-20 09:44:28  
> 原文: <https://www.yuque.com/viruspc/el3mi0/av6wb46vpf4wch06>