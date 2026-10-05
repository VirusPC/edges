# Cloudflare 橙云：Origin 证书 + Nginx + Full (strict)

> 可执行清单。已脱敏：不含公网/内网 IP、证书 PEM、AccessKey、token、认证 URL。

配套对话笔记：[`knowledge/notes/2026-09-07--Cloudflare橙云-Origin证书与Nginx-HTTPS.md`](../../../notes/2026-09-07--Cloudflare橙云-Origin证书与Nginx-HTTPS.md)

## 1. 橙云两段模型

橙云（Proxied / 橙色云朵）把 HTTPS 拆成两跳：

```text
浏览器 ──HTTPS──▶ Cloudflare 边缘证书
Cloudflare ──回源──▶ 源站 Nginx
```

面板里的 **Flexible / Full / Full (strict)** 只管第二跳（回源），不管访客看到的边缘证书。

- **521**：Cloudflare 回源失败。源站只开 80、回源却要求 443 时最常见。
- Origin CA 是给 Cloudflare 认的回源证书，浏览器默认不认；官方推荐与 Full (strict) 搭配。

## 2. 选型：何时 Flexible，何时 Origin + Full (strict)

| 场景 | 选什么 | 注意 |
| --- | --- | --- |
| 源站只有 80、要先消 521 | Flexible（过渡） | 回源明文；源站若强制 HTTP→HTTPS，会重定向环 |
| 长期橙云静态站 | Origin CA + Nginx `:443` + Full (strict) | 推荐默认 |
| 灰云直连或要浏览器也认源站证 | Let’s Encrypt 等公信 CA + Full (strict) | 橙云长期更省事的仍是 Origin CA |

**不要**把 Origin 证书配成「只要 Full、不要 Full (strict)」。Full 只检查「源站有证书」；Full (strict) 会校验有效期与主机名，且**同时接受**公信 CA 与 Cloudflare Origin CA。

## 3. 面板点击（签发 Origin 证书 + 改模式）

1. 进入对应 zone（不要从 DNS 菜单找证书）。
2. 左侧 **SSL/TLS → Origin Server → Create Certificate**。
3. 主机名勾 zone apex 与一级通配符（例如 `example.com`、`*.example.com`）。
4. 私钥与证书 PEM **只落源站磁盘**，不要写进仓库、聊天或截图。
5. 同一区 **SSL/TLS → Overview**，加密模式改为 **Full (strict)**。
6. 隧道/API token 往往能改 DNS，但不一定能签发 Origin CA；签发失败就改面板手动创建。

## 4. 安全组与 DNS

安全组（本人在云厂商控制台操作）：

- 入站放行 **TCP 80 / 443**（回源与健康检查需要）。
- **不要**为了「省事」把 22 绑到橙云站点主机名。

DNS：

- **站点主机名**：A 到 ECS 公网 IP，**橙云**（Proxied）。
- **SSH 专用主机名**：保持 **灰云**（DNS only）。SSH 不要走橙云 Web 代理域名；公网 SSH 用灰云主机名，或优先内网 / mesh。

## 5. Nginx 片段（占位路径，无真实密钥）

80 提供静态内容；443 挂 Origin 证书。Flexible 过渡期**不要**整站强制跳 HTTPS。

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name site.example.com;
    root /var/www/site;
    index index.html;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name site.example.com;

    ssl_certificate     /etc/nginx/ssl/origin.pem;
    ssl_certificate_key /etc/nginx/ssl/origin.key;

    root /var/www/site;
    index index.html;
}
```

源站上（需有写证书目录与 reload 权限的账号；若免密 sudo 只覆盖包管理器，这里仍要人工 sudo）：

```bash
sudo install -d -m 0750 /etc/nginx/ssl
# 把面板下发的证书/私钥放到上面两个路径后：
sudo nginx -t && sudo systemctl reload nginx
```

## 6. 验收 curl

把 `SITE` 换成站点主机名。不要把真实 IP、证书或 token 贴回仓库。

```bash
# 经橙云：应 200（或业务约定的成功码）
curl -sI "https://${SITE}" | head -n 15

# 直连源站 :443：未把 Origin CA 加进信任库时，curl 会报证书不受信任，这是预期
# 加上 --cacert 指向 Cloudflare Origin CA 根/中间证书后应能通
curl -vk --resolve "${SITE}:443:${ORIGIN_PUBLIC_IP}" "https://${SITE}/" | head -n 20
```

预期：

- `https://站点主机名` 经橙云返回 200。
- 直连源站 `:443` 只在信任 Origin CA 的客户端下校验通过。
- 临时改 Flexible 可消 521，但回源明文，验收完改回 Full (strict)。

## 相关链接

- https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/
- https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
