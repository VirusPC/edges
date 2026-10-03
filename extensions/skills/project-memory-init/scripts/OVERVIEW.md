# Project Memory runtime

`memory.py` 是稳定 CLI 入口：init 选择类型，remember 写已采用正文，add-type 登记自定义类型，doctor 诊断/修复索引。普通运行只有 `.harness` 新布局；旧 `.memory` 仅作 migration-required 检测，转换代码属于独立迁移 Skill。

- `lib/paths.py`：scope/root 边界、模块路径、真实路径所有权和来源扫描。`type_index_relpath` 现在是作用域相对路径。
- `lib/types.py`：从两个容器和本层链接发现 TypeSpec，module 与 format/writable 分开，私有忽略规则。
- `lib/blocks.py` / `templates.py`：受管标记与模板；不覆盖手写区块外文本。
- `nodes/agents.py`：本层类型清单和稀疏子层登记。
- `nodes/entries.py`：frontmatter、普通/Skill 格式、派生索引；失败扫描不覆盖原索引。
- `operations/`：组合上述能力，doctor 单独扫描作用域树。

类型入口路径必须通过 TypeSpec.index_file / type_index_path 使用；不能再写 `memory_dir(target) / index_file`。源内容根与索引根分开：referenced 的索引在 `.harness/skills`，内容在本层 `.agents/skills`。

```bash
TMPDIR=/private/tmp PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s extensions/skills/project-memory-init/scripts/tests
```

macOS `/var` 是别名，临时目录测试统一使用 `/private/tmp`。`tests/test_harness_layout.py` 使用真实文件系统与 CLI 覆盖选择、权限和扫描；`tests/legacy_layout_fixtures.txt` 保留已移出运行时的历史迁移用例意图，供独立 migrator 接管，不算运行时通过的测试。
