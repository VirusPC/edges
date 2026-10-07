# Project Memory runtime

可执行入口为 `edges memory`，实现位于 Edges CLI 的 TypeScript service。Skill 保留工作流与内容规范；不再通过同级 Skill 路径查找 Python 脚本。

- `init`：在用户选定目录写出/刷新系统入口 `AGENTS.md`，只采用显式选择的 memory/skill 类型；不在作用域根自动创建组织清单 `README.md`；重复调用刷新已采用类型。
- `remember`：写入条目并刷新其类型索引和层入口。
- `add-type`：登记自定义格式与权限；不会隐式初始化作用域。
- `doctor`：诊断作用域和索引，只有 `--apply` 写修复。
- `migrate`：显式将旧 .memory 转为 .harness，保留冲突检测与恢复日志。
- `backup` / `restore`：归档与恢复私有用户记忆，恢复覆盖仍需明确授权。

使用 `edges --scope <目录> memory <命令> --help` 查看契约。模板真源位于本 Skill 的 references/templates；CLI 构建产物自带模板，安装后的命令不依赖相邻 Skill 目录。源码环境与构建后环境共用同一套模板内容。

运行时测试位于 `extensions/cli/test/memory/`，覆盖真实临时目录上的选择式初始化、写入与索引、来源权限、私有规则、检查修复和迁移归档。不使用真实用户记忆作为测试数据。
