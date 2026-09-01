# 内网穿透 - Cloudflare Connector

前置条件：DNS 从阿里云切到cloudflare



![1771516553549-2842c9c9-1381-467f-b5c1-7927b546671a.png](./img/1NC-K8E6aOSkF8WX/1771516553549-2842c9c9-1381-467f-b5c1-7927b546671a-760319.png)![1771516739810-7f67c40b-6c1c-45c7-ac46-74e23ec07247.png](./img/1NC-K8E6aOSkF8WX/1771516739810-7f67c40b-6c1c-45c7-ac46-74e23ec07247-611773.png)

![1771516782350-faf9e885-9918-41dd-8a46-780784cceeb4.png](./img/1NC-K8E6aOSkF8WX/1771516782350-faf9e885-9918-41dd-8a46-780784cceeb4-874496.png)

一般用docker。记得用tmux开个后台进程。

![1771516867161-9e3d571c-67eb-4399-beb2-ebe4d1a64648.png](./img/1NC-K8E6aOSkF8WX/1771516867161-9e3d571c-67eb-4399-beb2-ebe4d1a64648-979071.png)

连接成功后会显示状态

![1771517902745-730cead7-cc8a-419f-921a-faba4714ba57.png](./img/1NC-K8E6aOSkF8WX/1771517902745-730cead7-cc8a-419f-921a-faba4714ba57-352274.png)



配置domain

![1771517935501-ce3528e3-5d19-463b-a856-75effbee7276.png](./img/1NC-K8E6aOSkF8WX/1771517935501-ce3528e3-5d19-463b-a856-75effbee7276-168608.png)

注意下，cloudflared跑在docker时，这里要用host.docker.internal





![1771523551698-b89823d5-5532-4f63-945d-8c434c67d969.png](./img/1NC-K8E6aOSkF8WX/1771523551698-b89823d5-5532-4f63-945d-8c434c67d969-977184.png)



> 更新: 2026-02-19 18:28:59  
> 原文: <https://www.yuque.com/viruspc/el3mi0/brhydnxk0e1kaw7e>