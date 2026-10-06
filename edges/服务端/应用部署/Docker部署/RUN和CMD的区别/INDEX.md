# RUN 和 CMD 的区别

- [\*\*1. \*\*`RUN npm install`](#1-run-npm-install)
- [\*\*2. \*\*`CMD ["npm", "install"]`](#2-cmd-npm-install)
- [**核心区别对比**](#%E6%A0%B8%E5%BF%83%E5%8C%BA%E5%88%AB%E5%AF%B9%E6%AF%94)
- [**常见问题解析**](#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E8%A7%A3%E6%9E%90)
  * [**Q1：为什么 **`CMD ["npm", "install"]`** 会导致容器退出？**](#q1%E4%B8%BA%E4%BB%80%E4%B9%88-cmd-npm-install-%E4%BC%9A%E5%AF%BC%E8%87%B4%E5%AE%B9%E5%99%A8%E9%80%80%E5%87%BA)
  * [**Q2：如何在开发环境优化依赖安装？**](#q2%E5%A6%82%E4%BD%95%E5%9C%A8%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83%E4%BC%98%E5%8C%96%E4%BE%9D%E8%B5%96%E5%AE%89%E8%A3%85)
  * [**Q3：生产环境如何减少镜像体积？**](#q3%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E5%A6%82%E4%BD%95%E5%87%8F%E5%B0%91%E9%95%9C%E5%83%8F%E4%BD%93%E7%A7%AF)
- [**总结：如何选择？**](#%E6%80%BB%E7%BB%93%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9)

---

在 Docker 中，`RUN npm install` 和 `CMD ["npm", "install"]` **有本质区别**，它们分别作用于镜像构建阶段和容器运行阶段，直接影响依赖安装的时机和容器的行为：

***

### \*\*1. \*\*`RUN npm install`

* **作用阶段**：**镜像构建阶段**（`docker build` 时执行）
* **行为**：
  * 在构建镜像时执行 `npm install`，将 `node_modules` 安装到镜像的文件系统中。
  * 安装结果会**固化到镜像层**，后续启动容器时直接使用。
* **典型用途**：\
  构建包含依赖的完整应用镜像（**生产环境推荐**）。
* **示例**：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install   # 构建时安装依赖（写入镜像层）
COPY . .
CMD ["npm", "start"]
```

***

### \*\*2. \*\*`CMD ["npm", "install"]`

* **作用阶段**：**容器启动阶段**（`docker run` 时执行）
* **行为**：
  * 容器每次启动时执行 `npm install`，`node_modules` **不会写入镜像**，而是存储在容器层（临时可写层）。
  * 如果容器被销毁，安装结果会丢失。
* **典型用途**：\
  开发环境调试（需挂载卷持久化 `node_modules`），**生产环境禁止**！
* **错误示例**：

```dockerfile
# 错误用法！容器启动后安装依赖，然后退出
FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["npm", "install"]  # 容器启动时安装，执行完 install 进程退出
```

***

### **核心区别对比**

| **特性** | `RUN npm install` | `CMD ["npm", "install"]` |
| --- | --- | --- |
| **执行时机** | 镜像构建时 (`docker build`) | 容器启动时 (`docker run`) |
| **依赖存储位置** | 固化在镜像层（永久保存） | 容器临时可写层（容器销毁后丢失） |
| **镜像体积** | 增大（包含 `node_modules`） | 较小（不包含 `node_modules`） |
| **容器启动速度** | 快（依赖已预装） | 慢（每次启动需重新安装） |
| **依赖持久性** | ✅ 持久化 | ❌ 依赖随容器销毁丢失 |
| **典型场景** | 生产部署 | 开发调试（需配合 Volume 持久化依赖） |

***

### **常见问题解析**

#### **Q1：为什么 **`CMD ["npm", "install"]`** 会导致容器退出？**

* `npm install` 执行完成后进程结束，Docker 容器要求**至少有一个前台进程持续运行**，没有前台进程时容器自动退出。
* **正确做法**：若需启动时安装依赖，应组合命令使其最后能启动前台进程：

```dockerfile
# 开发环境专用：启动时安装依赖并运行服务
CMD ["sh", "-c", "npm install && npm start"]
```

#### **Q2：如何在开发环境优化依赖安装？**

使用 \*\*Volume 挂载 \*\*`node_modules` 避免重复安装：

```dockerfile
# 开发环境 Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install  # 构建时安装基础依赖（如 npm ci）
COPY . .
CMD ["npm", "start"]
```

运行容器时挂载目录（宿主机 `node_modules` 复用容器内依赖）：

```bash
docker run -v $(pwd)/node_modules:/app/node_modules -v $(pwd):/app my-image
```

#### **Q3：生产环境如何减少镜像体积？**

使用 **多阶段构建** 剥离开发依赖：

```dockerfile
# 阶段1：安装所有依赖（含 devDependencies）
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 阶段2：仅复制生产依赖
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules  # 仅复制依赖
COPY . .
CMD ["npm", "start"]
```

***

### **总结：如何选择？**

| **场景** | **推荐方案** |
| --- | --- |
| **生产环境** | `RUN npm install`（依赖固化到镜像） |
| **开发环境** | `RUN npm install` + \*\*Volume 挂载 \*\*`node_modules`（避免宿主机与容器依赖冲突） |
| **特殊调试需求** | `CMD ["sh", "-c", "npm install && ..."]`（配合 `--rm` 临时容器） |

> ⚠️ \*\*永远不要在生产环境使用 \*\*`CMD ["npm", "install"]`\
> 会导致每次启动容器重复安装依赖，且容器无法长期运行！


> 更新: 2025-08-17 01:31:18  
> 原文: <https://www.yuque.com/viruspc/el3mi0/kuyf99sknrt5ae9m>