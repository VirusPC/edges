# Docker部署

- [**部署步骤**](#%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)
  * [**1. 准备项目文件**](#1-%E5%87%86%E5%A4%87%E9%A1%B9%E7%9B%AE%E6%96%87%E4%BB%B6)
  * [**2. 编写 Dockerfile**](#2-%E7%BC%96%E5%86%99-dockerfile)
  * [**3. 构建 Docker 镜像**](#3-%E6%9E%84%E5%BB%BA-docker-%E9%95%9C%E5%83%8F)
  * [**4. 运行容器**](#4-%E8%BF%90%E8%A1%8C%E5%AE%B9%E5%99%A8)
  * [**5. 使用 Docker Compose（可选）**](#5-%E4%BD%BF%E7%94%A8-docker-compose%E5%8F%AF%E9%80%89)
  * [**6. 验证部署**](#6-%E9%AA%8C%E8%AF%81%E9%83%A8%E7%BD%B2)
  * [**7. 持久化数据（可选）**](#7-%E6%8C%81%E4%B9%85%E5%8C%96%E6%95%B0%E6%8D%AE%E5%8F%AF%E9%80%89)
  * [**8. 日志与监控**](#8-%E6%97%A5%E5%BF%97%E4%B8%8E%E7%9B%91%E6%8E%A7)
- [**关键注意事项**](#%E5%85%B3%E9%94%AE%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)
  * [**1. Dockerfile 编写**](#1-dockerfile-%E7%BC%96%E5%86%99)
  * [**2. 环境变量**](#2-%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
  * [**3. 端口映射**](#3-%E7%AB%AF%E5%8F%A3%E6%98%A0%E5%B0%84)
  * [**4. 数据持久化**](#4-%E6%95%B0%E6%8D%AE%E6%8C%81%E4%B9%85%E5%8C%96)
  * [**5. 安全性**](#5-%E5%AE%89%E5%85%A8%E6%80%A7)
  * [**6. 镜像优化**](#6-%E9%95%9C%E5%83%8F%E4%BC%98%E5%8C%96)
  * [**7. 容器编排**](#7-%E5%AE%B9%E5%99%A8%E7%BC%96%E6%8E%92)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

使用 Docker 部署项目是一种高效、标准化的方式。以下是一般 Docker 项目部署的详细步骤以及关键注意事项：

***

### **部署步骤**

#### **1. 准备项目文件**

* 确保项目代码完整，并包含以下必要文件：
  * **Dockerfile**: 定义如何构建项目的 Docker 镜像。
  * **docker-compose.yml**（可选）: 如果项目有多个服务（如前端、后端、数据库），可以使用 Docker Compose 管理。
  * **配置文件**: 如 `.env` 文件，用于定义环境变量。

***

#### **2. 编写 Dockerfile**

* 创建一个 `Dockerfile`，定义项目的运行环境和依赖。例如：

```plain
# 基础镜像
FROM node:16

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY package.json ./
COPY . .

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

***

#### **3. 构建 Docker 镜像**

* 使用以下命令构建镜像：

```bash
docker build -t your_project_name:latest .
```

* `your_project_name` 是镜像名称，可以根据项目命名。

***

#### **4. 运行容器**

* 使用以下命令运行容器：

```bash
docker run -d -p 3000:3000 --name your_container_name your_project_name:latest
```

* 参数说明：
  * `-d`: 后台运行容器。
  * `-p 3000:3000`: 将宿主机的端口映射到容器端口。
  * `--name`: 设置容器名称。

***

#### **5. 使用 Docker Compose（可选）**

* 如果项目包含多个服务（如数据库、缓存等），可以使用 `docker-compose.yml` 文件：

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    environment:
      - NODE_ENV=production
  db:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: mydb
```

* 启动服务：

```bash
docker-compose up -d
```

***

#### **6. 验证部署**

* 检查容器状态：

```bash
docker ps
```

* 通过浏览器或 API 工具访问暴露的端口，验证服务是否正常运行。

***

#### **7. 持久化数据（可选）**

* 如果项目需要数据库或其他持久化存储，使用 Docker 卷绑定宿主机目录：

```bash
docker run -d -v /host/data:/container/data your_project_name:latest
```

* 或在 `docker-compose.yml` 中定义：

```yaml
volumes:
  - /host/data:/container/data
```

***

#### **8. 日志与监控**

* 查看容器日志：

```bash
docker logs your_container_name
```

* 配置监控工具（如 Prometheus、Grafana）以监控容器运行状态。

***

### **关键注意事项**

#### **1. Dockerfile 编写**

* 确保基础镜像选择合适（如 `alpine` 版本更轻量化）。
* 尽量减少层数，优化构建速度。
* 使用 `.dockerignore` 文件排除不必要的文件（如 `.git`、`node_modules`）。

***

#### **2. 环境变量**

* 使用 `.env` 文件管理敏感信息（如数据库密码、API 密钥）。
* 在 `docker-compose.yml` 和 Dockerfile 中引用环境变量：

```yaml
environment:
  - DB_USER=${DB_USER}
  - DB_PASSWORD=${DB_PASSWORD}
```

***

#### **3. 端口映射**

* 确保端口映射不会与宿主机已有服务冲突。
* 使用 `-p` 参数或 `docker-compose.yml` 中定义端口。

***

#### **4. 数据持久化**

* 数据库或其他需要持久化的服务必须使用卷来保存数据，避免容器重启后数据丢失。

***

#### **5. 安全性**

* 不要将敏感信息硬编码到 Dockerfile 中。
* 使用非 root 用户运行容器：

```plain
RUN adduser -D myuser
USER myuser
```

***

#### **6. 镜像优化**

* 定期清理未使用的镜像和容器：

```bash
docker system prune -a
```

* 使用多阶段构建优化镜像大小。

***

#### **7. 容器编排**

* 如果需要大规模部署，考虑使用 Kubernetes 或其他容器编排工具。

***

### **总结**

Docker 项目部署的核心步骤包括准备项目文件、编写 Dockerfile、构建镜像、运行容器以及验证服务运行。关键注意事项包括环境变量管理、安全性、数据持久化和镜像优化。在实际生产环境中，可以结合容器编排工具（如 Kubernetes）进一步提升部署效率和服务稳定性。


> 更新: 2025-07-19 10:02:10  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gie2bdmohoxn1bze>