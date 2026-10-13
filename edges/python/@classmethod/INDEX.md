# vs staticmethod
不完全一样。Python 里其实有**三种**方法，`@classmethod` 和其他语言的 static method 有区别：

## 三种方法对比

| 类型 | 装饰器 | 第一个参数 | 能访问什么 |
|------|--------|-----------|-----------|
| 实例方法 | 无 | `self`（实例） | 实例属性 + 类属性 |
| 类方法 | `@classmethod` | `cls`（类本身） | 类属性（不能访问实例） |
| 静态方法 | `@staticmethod` | 无 | 都不自动传入 |

## 关键区别

**`@staticmethod`** 才是最接近其他语言（Java/C++）里 `static method` 的东西——它就是一个「挂在类命名空间下的普通函数」，不接收 `self` 也不接收 `cls`：

```python
class Foo:
    @staticmethod
    def add(a, b):
        return a + b  # 没有 self / cls，纯函数
```

**`@classmethod`** 则是 Python 比较有特色的东西，很多语言没有直接对应。它会自动把**类本身**作为第一个参数 `cls` 传进来：

```python
class Foo:
    count = 0

    @classmethod
    def create(cls):
        return cls()  # cls 是 Foo，子类调用时是子类
```

`cls` 的价值在于**多态**：子类调用时 `cls` 指向子类，所以常用于工厂方法、备用构造函数（如 `dict.fromkeys`、`datetime.now`）。

## 回到你的代码

```78:81:src/sns_memory/modules/agentic_memory/types.py
    @field_validator("team", "scope", mode="before")
    @classmethod
    def _lower_team_scope(cls, v: str) -> str:
        return v.lower() if isinstance(v, str) else v
```

这里用 `@classmethod` 而不是 `@staticmethod`，**并不是因为代码里真的用到了 `cls`**（它压根没用 `cls`），而是因为 **Pydantic v2 官方约定** `field_validator` 要写成类方法。这样 Pydantic 内部调用校验器时可以拿到类信息（比如访问其他字段配置、支持继承时子类覆盖等）。

> 小结：如果只看这个函数体，它逻辑上是个静态函数；但框架要求用 `@classmethod` 的形式声明。所以「像不像 static method」——**行为上像，但形式上是 classmethod，这是 Pydantic 的硬性要求**。
# 场景
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