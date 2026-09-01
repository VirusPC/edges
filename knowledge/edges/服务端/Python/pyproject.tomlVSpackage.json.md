# pyproject.toml VS package.json

下面以表格形式对比 pyproject.toml 与 package.json 的主要字段，按功能分组展示常用、核心对应关系。

| **功能分组** | **pyproject.toml 字段** | **说明（Python）** | **package.json 字段** | **说明（Node.js）** |
| --- | --- | --- | --- | --- |
| 基础元数据 | [project].name | 包名称（PEP 621） | name | 包名称 |
| | [project].version | 版本号，亦可由构建后端动态生成 | version | 版本号 |
| | [project].description | 项目描述 | description | 项目描述 |
| | [project].readme | README 文件路径或内联文本 | （无字段约定）README.md 文件 | 通常使用 README.md 文件 |
| | [project].license | 许可证（文本或文件） | license | 许可证标识 |
| | [project].authors / maintainers | 作者/维护者列表 | author / contributors | 作者/贡献者 |
| | [project].urls | 各类链接（homepage、repository、bugs 等） | homepage / repository / bugs | 主页、仓库、问题跟踪 |
| 运行与环境约束 | [project].requires-python | 运行所需 Python 版本范围 | engines.node（及 npm/yarn） | 运行所需 Node/npm/yarn 版本 |
| 入口与命令 | [project.scripts] | 安装后暴露的命令（console_scripts） | bin | 安装后暴露命令的可执行映射 |
| | [project.entry-points] | 插件系统入口（如 pytest 插件） | main / exports | 包入口、导出映射 |
| | （无统一 scripts 段） | 开发任务通常用工具命令（tox/nox/uv run 等） | scripts | 开发脚本中心，如 build/test/dev |
| 依赖管理 | [project].dependencies | 运行依赖（PEP 508/440 约束） | dependencies | 运行依赖（semver） |
| | [project.optional-dependencies] | 可选功能集（extras） | optionalDependencies | 可选依赖 |
| | （常用 dev 组或工具管理） | 开发依赖可放在 extras: dev 或用独立文件/工具 | devDependencies | 开发依赖 |
| | 环境标记（markers） | 条件依赖，如 python_version、platform_system | （无原生条件依赖） | 多以脚本或可选依赖实现 |
| 锁与安装 | （锁文件独立：uv.lock/poetry.lock） | 通过包管理器产生与使用 | package-lock.json / yarn.lock / pnpm-lock.yaml | 安装时自动生成或由 ci 使用 |
| 构建与打包 | [build-system] | 指定构建后端与其依赖（PEP 518/517） | （无直接等价） | 构建通常由 scripts + 工具配置决定 |
|  | [tool.] | 工具集中配置（ruff、black、pytest、mypy 等） | 内联工具配置字段或独立文件 | 如 eslintConfig、babel、prettier 或 .eslintrc 等 |
| 发布控制 | （由构建后端/工具定义） | 如包含文件、版本生成、发布目标 | private / files / publishConfig | 私有包、发布文件、注册表配置 |
| 模块系统 | （不适用） | Python 模块系统由语言决定 | type / module / main / browser / exports | ESM/CJS 与多目标导出配置 |
| 文件包含 | 构建后端/工具决定 | 如 setuptools/hatchling 配置或 MANIFEST.in | files / .npmignore | 发布包含/忽略的文件 |


补充说明：

+ pyproject.toml 是“标准容器”，构建细节由后端（setuptools、hatchling、poetry 等）决定；很多发布/包含策略会出现在 [tool.] 或 MANIFEST.in 中。
+ package.json 集中了承包依赖、脚本与模块导出；构建行为常通过 scripts 调用工具（如 tsc、vite、webpack），并可在 package.json 或独立文件配置。
+ 二者都与各自的锁文件配合使用以确保可复现安装：Python 侧 uv.lock/poetry.lock；Node 侧 package-lock.json/yarn.lock/pnpm-lock.yaml。



> 更新: 2026-02-14 08:05:05  
> 原文: <https://www.yuque.com/viruspc/el3mi0/qkqcr8e6l45apqle>