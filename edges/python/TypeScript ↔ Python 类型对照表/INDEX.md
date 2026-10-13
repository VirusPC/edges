# TypeScript ↔ Python 类型对照表

## 一、基础类型（Primitive Types）

| TS 类型       | Python 对应       | 说明                                        |
| ----------- | --------------- | ----------------------------------------- |
| `number`    | `int` / `float` | Python 区分整型和浮点型；`float` 包含 `int`（子类型关系）   |
| `string`    | `str`           | 字符串，Python 3 默认 Unicode                   |
| `boolean`   | `bool`          | `True` / `False`（注意大小写）                   |
| `null`      | `None`          | Python 只有 `None`，没有 `undefined`           |
| `undefined` | —               | Python 没有 `undefined`；未赋值变量会抛 `NameError` |
| `symbol`    | `object()`      | 可用 `object()` 创建唯一标识符，或 `enum.Enum`       |
| `bigint`    | `int`           | Python 的 `int` 本身就是任意精度整数                 |
| `any`       | `Any`           | `from typing import Any`                  |
| `unknown`   | `object`        | 最接近的是 `object`，但运行时仍需断言                   |

---

## 二、集合/容器类型

| TS 类型 | Python 对应 | 说明 |
|---------|-------------|------|
| `T[]` / `Array<T>` | `list[T]` | Python 3.9+ 原生支持泛型；旧版用 `List[T]` |
| `Tuple<T, U>` | `tuple[T, U]` | 固定长度、固定类型；`tuple[int, ...]` 表变长 |
| `Object` / `Record<K, V>` | `dict[K, V]` | 字典；`Mapping[K, V]` 用于只读场景 |
| `Map<K, V>` | `dict[K, V]` | 或 `collections.OrderedDict` |
| `Set<T>` | `set[T]` | 无序不重复集合 |
| `WeakMap` / `WeakSet` | `WeakKeyDictionary` / `WeakSet` | `from weakref import ...` |

---

## 三、函数与特殊返回类型

| TS 类型 | Python 对应 | 说明 |
|---------|-------------|------|
| `(a: T) => U` | `Callable[[T], U]` | `from typing import Callable` |
| `void` | `None` | 函数无返回值 |
| `never` | `NoReturn` | `from typing import NoReturn`，表示永不正常返回 |
| `Promise<T>` | `Awaitable[T]` | 或 `Coroutine[Any, Any, T]`；Python 用 `async def` |

---

## 四、联合、交叉与可选

| TS 类型 | Python 对应 | 说明 |
|---------|-------------|------|
| `A \| B` (Union) | `A \| B` / `Union[A, B]` | Python 3.10+ 支持 `\|` 语法；旧版用 `typing.Union` |
| `A & B` (Intersection) | `Protocol` 多重继承 | Python **没有原生交集类型**；需用 `Protocol` 组合模拟 |
| `T \| null` / `Optional<T>` | `T \| None` / `Optional[T]` | Python 3.10+ 推荐 `T \| None` |

---

## 五、字面量与枚举

| TS 类型 | Python 对应 | 说明 |
|---------|-------------|------|
| `"a" \| "b"` (Literal) | `Literal["a", "b"]` | `from typing import Literal`（3.8+） |
| `enum Color` | `class Color(Enum)` | `from enum import Enum` |

---

## 六、TS 高级工具类型 → Python 方案

| TS 工具类型 | Python 对应 | 说明 |
|-------------|-------------|------|
| `interface` | `Protocol` / `TypedDict` | `Protocol` 用于结构子类型；`TypedDict` 用于 dict 形状 |
| `class` | `class` / `dataclass` | `from dataclasses import dataclass` |
| `Readonly<T>` | `Final` / `frozen=True` | 变量用 `Final[T]`；类用 `@dataclass(frozen=True)` |
| `Partial<T>` | `TypedDict(total=False)` | Python 没有 `Partial` 泛型，需手动声明可选字段 |
| `Required<T>` | `TypedDict` 中 `total=True` | 默认字段就是 required |
| `Pick<T, K>` / `Omit<T, K>` | — | **无直接对应**，需手动定义子类或新 `TypedDict` |
| `Record<K, V>` | `dict[K, V]` | 完全等价 |
| `ReturnType<F>` | — | Python 无此工具类型，可用 `inspect` 或类型推断 |
| `Parameters<F>` | — | 无直接对应 |

---

## 七、关键差异总结

| 特性 | TypeScript | Python |
|------|------------|--------|
| **类型检查时机** | 编译时（静态） | 运行时可选（`mypy` / `pyright` 静态检查） |
| `undefined` vs `null` | 两者都有 | 只有 `None` |
| 交集类型 `A & B` | 原生支持 | 无原生支持，用 `Protocol` 模拟 |
| 结构类型 | 支持（duck typing） | `Protocol` 支持结构子类型 |
| 泛型默认值 | 支持 | Python 3.12+ 支持 `def f[T = int]()` |

---

## 八、快速参考示例

```python
from typing import Protocol, TypedDict, Literal, Any, Callable, Union

# interface → Protocol
class Drawable(Protocol):
    def draw(self) -> None: ...

# Record<string, number> → dict[str, int]
config: dict[str, int] = {"width": 100}

# "GET" | "POST" → Literal
method: Literal["GET", "POST"] = "GET"

# (x: number) => string → Callable[[int], str]
formatter: Callable[[int], str] = lambda x: str(x)

# unknown → object（最安全的对应）
value: object = fetch_something()
```

如需进一步了解某个具体类型的**最佳实践**（比如如何用 `Protocol` 替代 TS 的 `interface`，或 `TypedDict` 替代 `Record`），可以继续问。