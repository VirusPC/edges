# scripts

实现代码。形状看 [`../references/PROTOCOL.md`](../references/PROTOCOL.md)，落盘形态看 [`../references/LAYOUT.md`](../references/LAYOUT.md)。

**对外只有一个入口**：`python3 memory.py <init|doctor|remember>`，参数见 `--help`。三个 skill 都走这条命令，不要直接 import 子目录。

四层，依赖只朝下：`memory.py` → `operations/` → `nodes/` → `lib/`。加功能时找对应那一层，别往 `memory.py` 堆。反向依赖会立刻变成找不到模块。

```text
.
├── memory.py       # CLI：参数、JSON 输出、错误收口
├── operations/     # 三个子命令，与三个 skill 对齐
│   ├── init.py     # 单目录、只往前写
│   ├── remember.py # 写一条记忆并重算索引
│   └── doctor.py   # 扫全树，修索引不一致
├── nodes/          # 协议里的两类节点
│   ├── agents.py   # 入口文件 AGENTS.md
│   └── entries.py  # 记忆文件与分类型入口
└── lib/            # 公共件；不知道操作的存在
    ├── blocks.py   # 标记与区块
    ├── templates.py
    ├── paths.py
    └── provenance.py
```

各包的 `__init__.py` 只有一句职责，不向外再导出。

## 改哪里

| 要做的事 | 打开 |
| --- | --- |
| 加 CLI 参数或子命令 | `memory.py`，逻辑放到 `operations/` |
| 改 init / remember / doctor 的行为 | 对应的 `operations/*.py` |
| 改 `AGENTS.md` 区块怎么维护、下层索引怎么登记 | `nodes/agents.py` |
| 改记忆文件读写、frontmatter、分类型入口怎么重算 | `nodes/entries.py` |
| 改区块标记名或嵌套顺序 | `lib/blocks.py`，并同步 [`../references/LAYOUT.md`](../references/LAYOUT.md) |
| 改产物文案、字段清单、行格式、类型清单 | [`../references/templates/`](../references/templates/)，不要改脚本 |
| 改路径约定（`.memory`、`AGENTS.md`、skill 根） | `lib/paths.py` |
| 改出处 / 审计字段从哪来 | `lib/provenance.py` + [`../references/frontmatter-fields.md`](../references/frontmatter-fields.md) |

加一个记忆类型：在 `AGENTS.tmpl.md` 的本层记忆区块加一行，再放一份同名模板。脚本从那几行推导，不用动。

## 怎么跑

直接调 `memory.py`，不要 `python -m`。stdout 是一份 JSON：成功带 `"ok": true`，失败带 `"ok": false` 和 `"error"`。

```bash
python3 memory.py init --target-dir <目录> [--root-dir <工作区根>] [--description <说明>]
python3 memory.py doctor --target-dir <记忆树里任一目录> [--apply]
python3 memory.py remember --target-dir <目录> --type <feedback|project|reference> --slug <slug> ...
```

`remember` 的完整参数以 `--help` 为准。
