了解你熟悉 TypeScript，这会极大加快我们的学习进度！TypeScript 和现代 Python 的类型提示在设计哲学上非常相似——它们都是在原有的动态语言（JavaScript/Python）之上，添加了一层用于静态检查和提升开发者体验的类型系统。

我们直接用代码对比 ⚖️ 的方式来看看它们是如何映射的。

### 1. 基础类型与函数签名 📝

在基础类型上，两者的主要区别在于关键字的名称，以及 Python 使用 `->` 来标记返回值。

|**概念**|**TypeScript**|**Python**|**说明**|
|---|---|---|---|
|**基础变量**|`let age: number = 25;`<br><br>  <br><br>`let isDone: boolean = true;`|`age: int = 25`<br><br>  <br><br>`is_done: bool = True`|Python 区分 `int` 和 `float`，而 TS 统称为 `number`。布尔值在 Python 中首字母大写且类型名为 `bool`。|
|**函数签名**|`function greet(name: string): string { ... }`|`def greet(name: str) -> str:`<br><br>  <br><br>`...`|Python 在参数括号后使用 `->` 来指定返回值类型。|
|**无返回值**|`function log(): void { ... }`|`def log() -> None:`<br><br>  <br><br>`...`|TS 的 `void` 在 Python 中对应返回 `None`。|

### 2. 进阶类型结构 📦

得益于 Python 3.10 及以上版本的更新，Python 的复杂类型语法现在看起来和 TypeScript 惊人地相似。

|**概念**|**TypeScript**|**Python (3.10+)**|**说明**|
|---|---|---|---|
|**数组/列表**|`string[]` 或 `Array<string>`|`list[str]`|Python 中直接使用内置的 `list` 配合方括号 `[]` 表示泛型。|
|**字典/对象**|`Record<string, number>`|`dict[str, int]`|Python 中键值对的容器是 `dict`，方括号内依次是 `[键类型, 值类型]`。|
|**联合类型**|`string \| number`|`str \| int`|语法完全一致！_(注：在 Python 3.9 及更早版本中，需要写成 `Union[str, int]`)_|
|**可选类型**|`string \| null`|`str \| None`|Python 中的 `None` 兼具了 TS 中 `null` 和 `undefined` 的语义。_(旧版本 Python 写成 `Optional[str]`)_|

结合上面的对比表，我们来完成之前提到的那个小练习：

在 TypeScript 中，如果我们要写一个接收字符串数组，并在数组不为空时返回第一个字符串、为空时返回 `null` 的函数，它的签名是这样的：

`function getFirstItem(items: string[]): string | null`

你能根据我们刚刚梳理的映射规则，写出这个函数在 **Python** 中的第一行定义（即 `def ...`）吗？