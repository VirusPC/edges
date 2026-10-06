| 类型            | 字面量写法                  | 空容器写法                          | 增                         | 删                              | 改           | 查                     | 特殊用法                                                | 导入方式                          | 备注                            |
| ------------- | ---------------------- | ------------------------------ | ------------------------- | ------------------------------ | ----------- | --------------------- | ---------------------------------------------------- | ------------------------------ | ----------------------------- |
| `list`        | `[1, 2, 3]`            | `[]` 或 `list()`                | `append(x)` / `insert(i, x)` | `remove(x)` / `pop(i)` / `del[i]` | `lst[i] = x` | `lst[i]` / `x in lst`  | 列表推导式；切片 `lst[::-1]`；栈 `append/pop`                    | 内置                             | 有序，可重复，可变                     |
| `tuple`       | `(1, 2, 3)` 或 `1, 2, 3` | `()` 或 `tuple()`               | ❌ 不可变（只能 `t + (x,)`）      | ❌ 不可变                         | ❌ 不可变      | `t[i]` / `x in t`      | 可哈希，可作 dict key；解包 `a, b = t`；`*args`                  | 内置                             | 单元素必须加逗号：`(1,)`               |
| `deque`       | ❌ **无字面量**             | `deque()`                      | `append(x)` / `appendleft(x)` | `pop()` / `popleft()`           | `d[i] = x`  | `d[i]` / `x in d`      | `rotate(n)`；`deque(maxlen=N)` 定长滑动窗口                      | `from collections import deque` | 双端队列，两端操作 O(1)                |
| `dict`        | `{"a": 1, "b": 2}`     | `{}` 或 `dict()`                | `d[k] = v` / `update(...)`  | `del d[k]` / `pop(k)`           | `d[k] = v`  | `d[k]` / `get(k)` / `k in d` | 字典推导式；`setdefault(k, v)`；`items()`；`**kwargs`            | 内置                             | **注意**：`{}` 是空 dict，不是 set    |
| `defaultdict` | ❌ **无字面量**             | `defaultdict(int)`             | `dd[k].append(x)` 等        | `del dd[k]`                     | `dd[k] = v` | `dd[k]` / `k in dd`    | 访问不存在的键自动创建默认值；自动分组 `dd[k].append(x)`；嵌套 `defaultdict(dict)` | `from collections import defaultdict` | 自动为不存在的键提供默认值                |
| `Counter`     | ❌ **无字面量**             | `Counter()`                    | `update(iter)` / `c[k] += 1` | `del c[k]` / `subtract(...)`    | `c[k] = n`  | `c[k]` / `most_common()` | 数学运算 `+ - & \|`；`elements()`；异位词 `Counter(s) == Counter(t)` | `from collections import Counter` | 计数字典，访问不存在键返回 0              |
| `set`         | `{1, 2, 3}`            | `set()`（不能用 `{}`）             | `add(x)` / `update(iter)`   | `remove(x)` / `discard(x)`      | ❌ 只能增删     | `x in s`              | 去重 `set(lst)`；集合运算 `&` `\|` `-` `^`                       | 内置                             | 无序，不重复，可变                     |
| `frozenset`   | ❌ **无字面量**             | `frozenset()`                  | ❌ 不可变                     | ❌ 不可变                         | ❌ 不可变      | `x in fs`             | 可哈希，可作 dict key 或 set 元素                                | 内置                             | 只能用构造函数，不可变                   |

# Set
| **💡 操作** | **🟦 TypeScript (Set)** | **🐍 Python (set)**                | **🎯 LeetCode 常见场景** |
| --------- | ----------------------- | ---------------------------------- | -------------------- |
| **创建**    | `new Set()`             | `set()` 或 `{1, 2}`                 | 初始化去重                |
| **添加**    | `s.add(val)`            | `s.add(val)`                       | 记录访问过的节点/死循环检测       |
| **删除**    | `s.delete(val)`         | `s.remove(val)` / `s.discard(val)` | 滑动窗口移出元素 / 回溯状态重置    |
| **包含**    | `s.has(val)`            | `val in s` _(使用 in 关键字)_           | $O(1)$ 判断哈希冲突 / 查重   |

| 方法             | 元素存在         | 元素不存在        | 返回值    |
| -------------- | ------------ | ------------ | ------ |
| `s.remove(x)`  | 删除并返回 `None` | 抛 `KeyError` | `None` |
| `s.discard(x)` | 删除并返回 `None` | 静默忽略，不报错     | `None` |

### `add` vs `update`

| 方法            | 参数          | 行为             | 示例（初始 `s = {1, 2}`） |
| ------------- | ----------- | -------------- | --------------------- |
| `s.add(x)`    | 单个元素        | 把 `x` 作为一个元素加入 | `s.add(3)` → `{1, 2, 3}` |
| `s.update(iter)` | 可迭代对象       | 把可迭代对象里的元素逐个加入 | `s.update([3, 4])` → `{1, 2, 3, 4}`；`s.update("ab")` → `{1, 2, 'a', 'b'}` |

### `pop` 说明

`set.pop()` **不接收参数**，随机删除并返回一个元素；空 set 调用会抛 `KeyError`。

# List & Deque
| 操作   | JS               | Python list               | Python deque             |
| ---- | ---------------- | ------------------------- | ------------------------ |
| 头部移除 | `arr.shift()`    | `lst.pop(0)` (O(n))       | `d.popleft()` (O(1))     |
| 头部插入 | `arr.unshift(x)` | `lst.insert(0, x)` (O(n)) | `d.appendleft(x)` (O(1)) |
| 尾部移除 | `arr.pop()`      | `lst.pop()` (O(1))        | `d.pop()` (O(1))         |
| 尾部插入 | `arr.push(x)`    | `lst.append(x)` (O(1))    | `d.append(x)` (O(1))     |

### list 增删查方法差异

| 操作 | 方法                | 作用位置     | 返回值    | 不存在时行为     | 复杂度    |
| ---- | ----------------- | --------- | ------ | ---------- | ------ |
| 增   | `lst.append(x)`   | 末尾        | `None` | —          | O(1)   |
| 增   | `lst.insert(i, x)` | 下标 `i` 处 | `None` | —          | O(n)   |
| 删   | `lst.remove(x)`   | 第一个值为 `x` | `None` | 抛 `ValueError` | O(n)   |
| 删   | `lst.pop(i)`      | 下标 `i`    | 被删元素   | 抛 `IndexError` | 末尾 O(1)，头部 O(n) |
| 删   | `del lst[i]`      | 下标 `i`    | 无      | 抛 `IndexError` | O(n)   |
| 查   | `lst[i]`          | 下标 `i`    | 元素     | 抛 `IndexError` | O(1)   |
| 查   | `x in lst`        | 全局        | `bool` | —          | O(n)   |

### deque 两端方法差异

| 方法              | 作用端  | 说明        |
| --------------- | ---- | --------- |
| `d.append(x)`    | 右端   | 尾部加入，O(1) |
| `d.appendleft(x)` | 左端   | 头部加入，O(1) |
| `d.pop()`        | 右端   | 尾部弹出，O(1) |
| `d.popleft()`    | 左端   | 头部弹出，O(1) |

```py
from collections import deque

```
# Tuple

```py
>>> tuple([1, 2]) == tuple([1, 2])

True

>>> tuple([1, 2]) == tuple([2, 1])

False

str_dict = defaultdict(list)
ord_a = ord('a')
for s in strs:
	counts = [0] * 26
	for c in s:
		counts[ord(c) - ord_a] += 1
	str_dict[tuple(counts)].append(s)
return list(str_dict.values())
```
# Dict

### dict 增删查方法差异

| 操作 | 方法                  | 键存在时        | 键不存在时            | 返回值     |
| ---- | ------------------- | ------------ | ----------------- | ------- |
| 增/改 | `d[k] = v`          | 覆盖原值        | 新建键值对             | `None`  |
| 增   | `d.update({k: v})`  | 覆盖原值        | 批量/单个新建           | `None`  |
| 删   | `del d[k]`          | 删除          | 抛 `KeyError`      | 无       |
| 删   | `d.pop(k)`          | 删除并返回原值    | 抛 `KeyError`      | 原值      |
| 查   | `d[k]`              | 返回值         | 抛 `KeyError`      | 值       |
| 查   | `d.get(k, default)` | 返回值         | 返回 `default`（默认 `None`） | 值/default |
| 查   | `k in d`            | 返回 `True`   | 返回 `False`        | `bool`  |

### `setdefault` 特殊用法

`d.setdefault(k, v)`：如果 `k` 不存在，设置 `d[k] = v` 并返回 `v`；如果存在，直接返回原值。常用于「不存在才初始化」。

# defaultdict

`defaultdict` 是 `collections` 模块里的字典子类，核心逻辑是：**访问不存在的键时，自动调用一个工厂函数生成默认值，并存入字典**。

```python
from collections import defaultdict

# 1. 指定工厂函数
dd = defaultdict(list)   # 工厂是 list，默认值是 []
dd = defaultdict(int)    # 工厂是 int，默认值是 0

# 2. 访问缺失键时触发工厂
dd = defaultdict(list)
dd['a'].append(1)
# 过程：'a' 不存在 → 调用 list() → 得到 [] → 写入 dd['a'] → 再 append(1)
# 结果：dd == {'a': [1]}

# 3. 只有 dd[key] 语法会触发，get / in 不会
dd = defaultdict(int)
dd.get('x')   # None，不会创建 'x'
'x' in dd     # False，不会创建 'x'
dd['x']       # 触发工厂，创建 'x': 0
```

| 工厂函数 | 默认值 | 典型用法 |
|--------|--------|---------|
| `list` | `[]` | 自动分组：`dd[k].append(x)` |
| `int` | `0` | 计数：`dd[k] += 1` |
| `set` | `set()` | 去重分组：`dd[k].add(x)` |
| `dict` | `{}` | 嵌套字典：`defaultdict(dict)` |

### `dd[k]` vs `dd.get(k)` vs `k in dd`

| 写法            | 键不存在时的行为          | 是否会创建键 |
| --------------- | ------------------------ | ----------- |
| `dd[k]`         | 调用工厂生成默认值并返回   | ✅ 会创建    |
| `dd.get(k)`     | 返回 `None`               | ❌ 不会创建  |
| `k in dd`       | 返回 `False`              | ❌ 不会创建  |

**与普通 `dict` 的区别**：普通 `dict` 访问不存在的键会抛 `KeyError`，而 `defaultdict` 会静默创建默认值。

# Counter

`Counter` 是 `collections` 模块里的一个字典子类，专门用来**计数**。

## 一、基础用法

```python
from collections import Counter

# 1. 从可迭代对象创建
words = ["apple", "banana", "apple", "orange", "banana", "apple"]
c = Counter(words)
# Counter({'apple': 3, 'banana': 2, 'orange': 1})

# 2. 从字符串创建（统计字符）
Counter("mississippi")
# Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})

# 3. 手动传入
Counter(a=3, b=1)
```

## 二、常用操作

```python
c = Counter(["a", "b", "a", "c", "a"])

# 访问计数（不存在的键返回 0，不会报错）
c["a"]      # 3
c["z"]      # 0

# 获取最常见的 n 个
c.most_common(2)   # [('a', 3), ('b', 1)]
c.most_common()    # 全部排序 [('a', 3), ('c', 1), ('b', 1)]

# 元素展开（按计数重复）
list(c.elements()) # ['a', 'a', 'a', 'b', 'c']

# 更新计数
c.update(["a", "b", "b"])   # 累加
c.subtract({"a": 2})        # 减法（可减到负数）

# 直接赋值/删除
c["d"] = 5
del c["d"]
```

## 三、数学运算（集合式操作）

```python
a = Counter(a=3, b=1)
b = Counter(a=1, b=2)

a + b   # Counter({'a': 4, 'b': 3})    对应位置相加
a - b   # Counter({'a': 2})            只保留正数，小于等于0的丢弃
a & b   # Counter({'a': 1, 'b': 1})    取最小值（交集）
a | b   # Counter({'a': 3, 'b': 2})    取最大值（并集）
```

## 四、实用场景

```python
# 1. 找列表中出现次数最多的元素
nums = [1, 2, 2, 3, 3, 3, 4]
Counter(nums).most_common(1)[0][0]  # 3

# 2. 判断两个字符串是否为字母异位词
def is_anagram(s: str, t: str) -> bool:
    return Counter(s) == Counter(t)

# 3. 配合 defaultdict 做嵌套计数
from collections import defaultdict
# 其实 Counter 本身就能胜任大部分场景
```

## 五、注意点

| 注意 | 说明 |
|------|------|
| 返回 0 不报错 | `c["不存在的键"]` 返回 `0`，但**不会写入**字典 |
| `subtract` 可产生负数 | `c - d` 会丢弃负数，`c.subtract(d)` 保留负数 |
| `most_common` 是 O(n log n) | 因为内部排序，数据量大时慎用 |
| 它是 `dict` 子类 | 支持所有字典方法：`keys()`, `values()`, `items()` 等 |

---

**一句话**：`Counter` 就是一个**带默认值为 0 的自动计数字典**，配合 `most_common()` 和数学运算非常顺手。

# Sorted

```py
words = ["banana", "pie", "Washington"]

# reverse：降序
sorted(words, reverse=True)  # ['pie', 'banana', 'Washington']

# key：指定排序依据
sorted(words, key=len)       # ['pie', 'banana', 'Washington']（按长度）
sorted(words, key=str.lower) # ['banana', 'pie', 'Washington']（忽略大小写）

# 多级排序：先按长度，再按字母
sorted(words, key=lambda x: (len(x), x.lower()))
```

# Tips
以下是本次对话中所有实用小技巧和易错点的速查总结：

---

## 一、类型系统

| 技巧 | 说明 |
|------|------|
| `Protocol` 替代 `interface` | Python 用 `Protocol` 实现结构子类型，不需要显式继承 |
| `Literal["GET", "POST"]` | 约束**值**；`"GET" \| "POST"` 会退化为 `str`，失去约束 |
| `+c` 清理 Counter | `+counter` 只保留正计数（去掉 0 和负数），但可读性差，生产环境建议封装 `normalize()` |
| `frozenset` 无字面量 | 只能用 `frozenset({1,2,3})` |
| `@runtime_checkable` | 让 `isinstance(obj, MyProtocol)` 可用，但只检查方法存在性，不检查签名 |

---

## 二、集合与列表操作

| 技巧 | 说明 |
|------|------|
| `remove` vs `discard` | `remove` 不存在抛 `KeyError`；`discard` 不存在静默忽略 |
| `{}` 是空 **dict** | 空 set 必须用 `set()` |
| `set` 没有 `.size()` | 统一用 `len()`，Python 所有容器都用 `len()` |
| `list` 无 `shift()` | 用 `pop(0)`，但它是 **O(n)**；频繁头部操作换 `deque` |
| `insert(-1, x)` 是陷阱 | 插在倒数第一**之前**，不是末尾；想插末尾用 `append` |
| 栈用 `list`，队列用 `deque` | 纯栈操作 `list` 更快；`deque` 是双端队列，不是 `list` 的上位替代 |
| `insert` 是 **O(n)** | 中间/头部插入会移动后续所有元素 |

---

## 三、排序

| 技巧 | 说明 |
|------|------|
| `sorted()` vs `list.sort()` | `sorted()` 返回新列表（无副作用）；`sort()` 原地修改返回 `None` |
| 多级排序 | `key=lambda x: (len(x), x.lower())` — 先按长度，相同再按字母 |
| 字符串数字排序 | `sorted(lst, key=int, reverse=True)` — 避免 `"10" < "2"` 的字典序陷阱 |
| 字符串比较 | 按 **Unicode 码点**逐字符比；大写 ASCII 码 < 小写，所以 `"Z" < "a"` |
| Python 3 无 `cmp` | 比较函数必须用 `functools.cmp_to_key(func)` 包装后传给 `key` |

---

## 四、遍历与枚举

| 技巧 | 说明 |
|------|------|
| `enumerate` | 用于**序列**（list/tuple/str），同时拿 `(索引, 值)` |
| `dict.items()` | 用于**字典**，同时拿 `(键, 值)` |
| `for x in arr` | 等价于 TS 的 `for...of`（遍历值）；Python 没有 TS `for...in` 那种遍历键的语义 |

---

## 五、函数式工具

| 技巧              | 说明                                                       |
| --------------- | -------------------------------------------------------- |
| `map` 是内置函数     | 不需要 import；`reduce` 才在 `functools` 里                     |
| 列表推导式 > `map`   | `[-x for x in arr]` 比 `list(map(lambda x: -x, arr))` 更直观 |
| `reduce` 能不用就不用 | 用 `sum`、`max`、`''.join` 替代；可读性更好                         |
| `map` 多列表并行     | `map(lambda x,y: x+y, a, b)` 可并行取多个列表元素                  |

---

## 六、Counter

| 技巧 | 说明 |
|------|------|
| `most_common(n)` | 返回前 n 个高频元素 |
| 数学运算 | `a + b` 相加、`a - b` 只保留正数、`a & b` 取最小值、`a \| b` 取最大值 |
| `==` 比较注意 0 值 | `Counter(a=1, b=0) == Counter(a=1)` 是 `False`，因为多了 `b: 0` |

---

## 七、快速运行 Python

| 技巧 | 说明 |
|------|------|
| `python3` 进 REPL | 最轻量，随手试代码 |
| `ipython` | 带自动补全、语法高亮，比原生 REPL 好用 |
| VS Code `Shift+Enter` | 选中代码直接发送到交互窗口执行，保留变量 |
| `python3 -c "code"` | 单行快速执行，无需进 REPL |
| `__pos__` / `__add__` | 都是 Python 标准魔术方法；`+obj` 调 `__pos__`，`a+b` 调 `__add__` |

---

## 八、算法模板

| 技巧 | 说明 |
|------|------|
| BFS 标准模板 | `deque` + `visited` + `popleft()`；二叉树层序遍历记 `level_size = len(queue)` |
| 两数之和（哈希） | 4 行：`seen = {}`，遍历找 `target - n`，找不到就存入 `seen[n] = i` |

---

**一句话总结**：Python 里 `{}` 是 dict、`len()` 统一量长度、列表推导式优先于 map/reduce、栈用 list 队列用 deque、排序 key 用 `lambda` 多级元组。