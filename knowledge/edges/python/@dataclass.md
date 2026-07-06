# Field

`field` 在 Python **dataclass** 里很常见，但只在「默认写法不够用」时才会用到。

## 什么时候会用到

| 场景 | 写法 | 原因 |
|------|------|------|
| 可变默认值（`list` / `dict` / 自定义对象） | `field(default_factory=list)` | 避免所有实例共享同一个对象 |
| 不想出现在 `__init__` 里 | `field(init=False)` | 由类内部或 `__post_init__` 赋值 |
| 不想出现在 `repr` / 比较里 | `field(repr=False, compare=False)` | 大字段、内部状态 |
| 需要从 dict 用别的 key 映射 | `field(metadata=...)` | 序列化、校验库会读 metadata |

你项目里这几处都是典型用法：

```43:45:src/cr_eval/models.py
    target_repo_dir: Path = field(  # 沙箱落地目录（clone/checkout 目标）
        default_factory=lambda: Path("result/repos")
    )
```

```81:82:src/cr_eval/models.py
    predicted: List[str] = field(default_factory=list)  # 该轮预测的文档 id 列表
    ordered: bool = True  # 预测是否有序（影响评测按 rank 还是按集合打分）
```

```97:97:src/cr_eval/models.py
    predict: PredictResult = field(default_factory=PredictResult)
```

## 什么时候不用

普通不可变默认值直接写就行，不需要 `field`：

```python
id: str
timeout: int = 360
ordered: bool = True
backend: str = "codewiz"
```

## 小结

- 写 dataclass 时，`field` **不算天天写**，但 **`default_factory` 几乎成了标配**（只要有 `list`/`dict`/嵌套 dataclass 默认值就会遇到）。
- 整个 Python 生态里，dataclass 本身很常用（配置、DTO、API 模型），所以 **`field(default_factory=...)` 是 dataclass 作者几乎都会记住的一招**。

可以记一条规则：**默认值是 `[]`、`{}` 或另一个 dataclass 实例 → 用 `field(default_factory=...)`；否则直接 `= 值`。**