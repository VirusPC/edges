
`@classmethod` 的核心特征是：**第一个参数是类本身 `cls`，而不是实例**。所以凡是「操作对象是『类』而不是『某个具体实例』」的场景，就该用它。下面是几个典型场景。

## 场景 1：备用构造函数（最常见）

一个类想支持多种「从不同数据源创建实例」的方式，`__init__` 只能有一个，其余用 `@classmethod` 提供。

```python
from datetime import datetime

class User:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(name=data["name"], age=data["age"])

    @classmethod
    def from_json(cls, text: str) -> "User":
        import json
        return cls.from_dict(json.loads(text))

# 标准库里的例子：
datetime.now()              # classmethod
datetime.fromtimestamp(0)   # classmethod
dict.fromkeys(["a", "b"])   # classmethod
```

命名习惯：`from_xxx` / `create_xxx` 基本都是 classmethod。

## 场景 2：需要多态的工厂（`cls` 会跟随子类）

用 `cls()` 而不是写死类名，子类调用时会自动创建子类实例。这是 classmethod 相比 staticmethod 的最大价值。

```python
class Animal:
    @classmethod
    def create(cls):
        return cls()   # cls 是谁调用就是谁

class Dog(Animal):
    pass

Dog.create()   # 返回 Dog 实例，而不是 Animal 实例
```

如果这里用 `@staticmethod` 写死 `return Animal()`，子类就拿不到自己的类型了。

## 场景 3：操作/读取类级别的状态

数据是挂在类上（所有实例共享），而不是某个实例上。

```python
class Config:
    _settings = {}

    @classmethod
    def set(cls, key, value):
        cls._settings[key] = value

    @classmethod
    def get(cls, key):
        return cls._settings.get(key)

Config.set("debug", True)   # 不需要实例
```

## 场景 4：框架/库要求（你代码里的情况）

有些框架规定回调必须是 classmethod，即使函数体没真正用到 `cls`。比如 Pydantic 的 `@field_validator`、`@model_validator`：

```78:81:src/sns_memory/modules/agentic_memory/types.py
    @field_validator("team", "scope", mode="before")
    @classmethod
    def _lower_team_scope(cls, v: str) -> str:
        return v.lower() if isinstance(v, str) else v
```

## 怎么快速判断该用哪种

一句话决策：

- 方法里要用到**实例数据** → 普通方法（`self`）
- 方法里要用到**类本身**（创建实例、访问类属性、需要子类多态）→ `@classmethod`（`cls`）
- 两者都不需要，只是逻辑上归属这个类的工具函数 → `@staticmethod`
- 框架有明确要求 → 按框架来（如 Pydantic 要 classmethod）

> 经验法则：当你发现自己在方法里写死了类名（`return User(...)`），并且这个类可能被继承，就应该改成 `@classmethod` + `cls(...)`。