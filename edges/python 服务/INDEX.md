你要做的事
在公司服务器上部署一个 RAG 服务：用户提问 → 检索相关文档 → 调外部 LLM API 生成回答。
技术选型
	•	Web 框架：FastAPI（异步，适合等外部 API 的 IO 密集场景）
	•	向量数据库：Qdrant（自托管首选，Docker 部署，毫秒级检索）
	•	Embedding：走外部 API（服务器没 GPU，本机跑太慢）
	•	LLM：走外部 API
	•	编排层：手写（链路简单，不用 LangChain）
项目结构

rag-service/                ← GitHub 仓库根目录
├── Dockerfile              ← 告诉 Docker 怎么构建镜像
├── docker-compose.dev.yml  ← 本地开发用，只起 Qdrant
├── docker-compose.prod.yml ← 服务器部署用，起所有服务
├── requirements.txt        ← Python 依赖
├── .env                    ← 环境变量（API key、数据库地址）
└── app/                    ← 业务代码
    ├── main.py
    ├── api/routes.py
    └── core/
        ├── config.py       ← pydantic-settings，读环境变量区分环境
        ├── embedder.py     ← Embedding API 调用
        ├── retriever.py    ← Qdrant 检索
        └── generator.py    ← LLM API 调用 + prompt 组装


RAG 核心流程
入库：文档 → 切块（100-500 token）→ 调 Embedding API 转向量 → 存入 Qdrant（向量 + 原文 payload）
查询：用户问题 → 转向量 → Qdrant 找最相似 top-K → 原文拼进 prompt → 调 LLM 生成回答
Qdrant 的角色
就是一个向量搜索引擎。只负责”存向量”和”按相似度找最近的”，不关心文本本身。通过 payload 挂载原文，搜到后拿回来喂给 LLM。
为什么用 Docker Compose 而不是全塞一个容器
服务拆开（Qdrant 一个容器、Python 应用一个容器），互不影响。挂了单独重启，升级单独替换，换数据库只改 compose 文件。体验上还是一台机器，共享网络，互相 localhost 访问。
两个环境的开发方式
本地开发（Mac）：Docker 只跑 Qdrant，Python 代码在本机 venv 裸跑。uvicorn --reload 改代码即时生效，IDE 调试正常。
服务器部署（Linux）：所有东西都容器化。Dockerfile 把代码和依赖打成镜像，docker compose up -d --build 一把拉起。
Dockerfile 做了什么
把你的项目文件夹变成镜像：拿一个精简 Linux + Python 环境 → 装依赖 → 拷入代码 → 生成镜像 → 跑容器。Dockerfile 和 docker-compose.yml 是给宿主机上的 Docker 引擎读的，不会拷进容器。
环境切换靠配置
代码里不写死地址，通过 .env 和环境变量区分。本地 QDRANT_HOST=localhost，服务器上 QDRANT_HOST=qdrant（容器服务名）。
代码发布到服务器
起步用 Git：代码推 GitHub，服务器 git pull + docker compose up -d --build。后续可以加 CI/CD 自动化。
下一步
确认服务器能装 Docker、能访问外网后，我可以直接生成完整的项目脚手架代码，拿过去就能跑。​​​​​​​​​​​​​​​​