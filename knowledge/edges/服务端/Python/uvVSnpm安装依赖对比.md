# uv VS npm 安装依赖对比

下面是精简且分组更清晰的命令对比表。在原有基础上新增“使用场景分组”一列，便于快速定位命令用途。

| **使用场景分组** | **场景** | **uv（Python）** | **说明** | **npm（Node.js）** | **说明** |
| --- | --- | --- | --- | --- | --- |
| 初始化与基础安装<br/> | 初始化项目 | uv init | 生成 pyproject.toml，可选创建 .venv | npm init -y | 生成 package.json |
| | 安装全部依赖 | uv sync | 基于声明/锁文件，并自动管理虚拟环境 | npm install | 基于 package.json/lockfile 安装到 node_modules |
| 依赖增删改<br/> | 新增生产依赖 | uv add requests | 写入依赖并更新 uv.lock | npm install axios --save | 写入 dependencies 并更新 lockfile |
| | 新增开发依赖 | uv add --dev pytest | 写入 dev 依赖并更新 uv.lock | npm install jest --save-dev | 写入 devDependencies 并更新 lockfile |
| | 移除依赖 | uv remove requests | 同步更新声明与锁文件 | npm uninstall axios | 同步更新 package.json 与锁文件 |
| 锁定与可复现<br/> | 生成/刷新锁文件 | uv lock | 解析生成 uv.lock | （无需单独命令）npm install/ci 维护 | npm 自动维护 package-lock.json |
| | 严格可复现安装 | uv sync --frozen | 仅使用 uv.lock，不重新解析 | npm ci | 严格遵守 package-lock.json |
| 全局与临时工具 | 全局安装工具 | uv tool install black | 全局安装到 uv 的工具环境 | npm install -g typescript | 系统范围全局安装 |
| | 全局更新/卸载 | uv tool upgrade/uninstall black | 管理全局工具生命周期 | npm update/uninstall -g typescript | 管理全局包生命周期 |
| | 临时执行未安装工具 | uvx ruff --fix . | 即时下载并隔离执行 | npx eslint . | 即时执行，无需全局安装 |
| 环境与执行<br/> | 创建虚拟环境 | uv venv | 项目级 .venv 隔离 | （不适用） | Node 无虚拟环境，常用 nvm/fnm 管理 Node 版本 |
| | 在项目环境中运行 | uv run pytest | 自动在项目虚拟环境中执行 | npm run test | 运行 package.json scripts |
| 源与网络 | 指定镜像/源 | uv pip install -i  -r reqs.txt | 也可在 pyproject.toml 配置索引 | npm config set registry  | 后续 install 使用该 registry |
| 调试与维护<br/> | 查看依赖树 | uv tree | 展示解析后的依赖关系 | npm ls | 展示依赖树 |
| | 清理缓存 | uv cache clean | 清理下载/构建缓存 | npm cache clean --force | 清理 npm 缓存 |
| 升级与发布<br/> | 升级依赖 | uv add requests@latest 或 uv pip install -U requests | 更新并锁定版本 | npm update 或 npm install axios@latest | 更新并写回 |
| | 构建与发布 | uv build；uv publish | 构建并发布到 PyPI | npm pack；npm publish | 打包并发布到 npm registry |


使用建议：

+ 只需记住分组即可：初始化与基础安装、依赖增删改、锁定与可复现、全局与临时工具、环境与执行、源与网络、调试与维护、升级与发布。每个分组下的 uv 与 npm 命令是一一对应的常见操作。
+ Python 项目优先用 uv 的 sync/add/remove/lock；Node 项目用 npm 的 install/uninstall/ci/run 等。
+ 临时工具执行优先用 uvx/npx，减少全局安装带来的维护成本。



> 更新: 2026-02-14 08:04:56  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ggkl0ta3voirazv6>