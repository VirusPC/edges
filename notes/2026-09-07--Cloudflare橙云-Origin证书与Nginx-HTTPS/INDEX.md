【讨论主题】
为阿里云 ECS 上的静态站（teach 子域）在 Cloudflare 橙云代理下打通 HTTPS：安全组放行、DNS、Nginx，以及 SSL/TLS 模式与证书选型。

【主要结论】
1. 橙云把 HTTPS 拆成两段：浏览器→Cloudflare（边缘证书）与 Cloudflare→源站（回源）。面板里的 Flexible / Full / Full (strict) 管的是第二段。
2. 521 常见含义：Cloudflare 回源失败。源站只开 80、而回源被要求走 443 时，容易出现 521。
3. 长期推荐组合：Cloudflare Origin Certificate + Nginx 监听 443 + SSL/TLS 模式 Full (strict)。Origin CA 是给回源用的，浏览器不直接认，但 Cloudflare 认；官方推荐与 Full (strict) 搭配。
4. Full 只要求源站「有证书」且不认真校验；Full (strict) 会校验有效性与主机名。Full (strict) 可接受公信 CA（如 Let’s Encrypt）或 Cloudflare Origin CA。
5. Flexible 最快救急：回源用 HTTP:80，源站无需证书；不宜作长期方案。若源站有 HTTP→HTTPS 强制跳转，勿用 Flexible（易重定向环）。
6. 面板路径：进入 zone → 左侧 SSL/TLS → Origin Server → Create Certificate（不在 DNS 菜单下）。
7. SSH 不要走橙云 Web 代理域名；公网 SSH 用灰云专用主机名，或优先内网/mesh 访问。
8. 源站运维账号免密 sudo 若仅限包管理器，写 Nginx/证书目录仍需人工 sudo。

【认知更新】
- 「橙云免费 HTTPS」解决的是访客→CF；源站证书是另一回事。
- 先前误区：以为 Origin 证书应配 Full 而非 Full (strict)；纠正为 Origin CA + Full (strict)。
- 先前误区：以为 Full (strict) 只认公信 CA；纠正为亦认 Origin CA。
- 隧道登录拿到的 token 往往能改 DNS，但不一定能签发 Origin CA；面板手动签发更稳。
- Let’s Encrypt 可用 DNS-01（Cloudflare API）签发通配符，适合灰云直连或 Full (strict)；橙云长期更省事的是 Origin CA。

【行动指南】
1. 安全组：源站入站放行 TCP 80/443（由本人在云厂商控制台操作，助手只说明步骤）。
2. DNS：站点主机名橙云 A 到 ECS 公网 IP；SSH 专用主机名保持灰云。
3. Nginx：80 提供静态内容；443 配置 ssl_certificate / ssl_certificate_key 指向 Origin 证书与私钥；不要在 Flexible 场景强制整站跳 HTTPS。
4. Cloudflare：SSL/TLS → Origin Server 创建证书（含 zone apex 与一级通配符）；拷到源站后执行安装/重载；Overview 将加密模式设为 Full (strict)。
5. 验收：https://站点主机名 返回 200；直连源站 :443 在信任 Origin CA 的客户端下可通。
6. 知识库缺口：此前缺「这台阿里云 + 域名 + 证书」可执行笔记；本篇补上。

【补充说明】
- 相关域名形态（示例，非密钥）：站点子域与 SSH 子域应分离橙云/灰云策略。
- 已验证路径：Origin 证书装入源站 Nginx 后，橙云 HTTPS 恢复正常。
- 临时 Flexible 可消 521，但回源明文，仅作过渡。

【相关链接】
- https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/
- https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
