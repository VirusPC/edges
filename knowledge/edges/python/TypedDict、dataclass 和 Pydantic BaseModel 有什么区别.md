三者都能描述”结构化数据”，但定位差很远。一句话总结：
	•	TypedDict：给 dict 加类型标注，运行时还是 dict
	•	dataclass：给类自动生成 __init__/__repr__/__eq__，标准库自带
	•	Pydantic BaseModel：带运行时校验和序列化的”数据模型”，第三方库
详细对比



|维度   |TypedDict           |dataclass        |Pydantic BaseModel    |
|-----|--------------------|-----------------|----------------------|
|来源   |`typing` 标准库        |`dataclasses` 标准库|`pydantic` 第三方        |
|运行时类型|`dict`              |普通类实例            |`BaseModel` 实例        |
|访问方式 |`obj["key"]`        |`obj.attr`       |`obj.attr`            |
|运行时校验|❌ 完全没有              |❌ 没有             |✅ 自动校验+转换             |
|默认值  |❌（只能用 `NotRequired`）|✅                |✅                     |
|方法/属性|❌                   |✅                |✅                     |
|序列化  |本身就是 dict           |手动 `asdict()`    |内建 `model_dump()`/JSON|
|性能开销 |零（就是 dict）          |很小               |中等（校验有成本）             |
|依赖   |无                   |无                |需安装                   |

代码对比

# TypedDict —— 本质是 dict
from typing import TypedDict
class User(TypedDict):
    name: str
    age: int

u: User = {"name": "Cheng", "age": 30}
u["age"]                          # 字典访问
u["age"] = "thirty"               # 运行时不报错！类型靠静态检查（mypy/pyright）

# dataclass —— 标准类
from dataclasses import dataclass
@dataclass
class User:
    name: str
    age: int = 0                  # 支持默认值

u = User(name="Cheng", age=30)
u.age                             # 属性访问
u.age = "thirty"                  # 同样不报错，没有运行时校验

# Pydantic —— 带校验的模型
from pydantic import BaseModel
class User(BaseModel):
    name: str
    age: int = 0

u = User(name="Cheng", age="30")  # 字符串自动转 int → 30
User(name="Cheng", age="abc")     # 抛 ValidationError
u.model_dump_json()               # 直接出 JSON


怎么选
TypedDict 适合：
	•	已经在用 dict 的代码加类型（比如 LangGraph state、API 返回的 JSON dict）
	•	不想改变数据结构，只想要 IDE 提示和静态检查
	•	性能敏感，不能有任何运行时开销
dataclass 适合：
	•	纯内部数据结构，数据可信、不需要校验
	•	想要点语法糖（自动 __init__、__eq__、__repr__），但不想引入依赖
	•	配合 frozen=True 做不可变值对象
Pydantic 适合：
	•	数据来自外部（HTTP 请求、配置文件、LLM 输出）需要校验
	•	需要 JSON 序列化/反序列化
	•	写 API（FastAPI 原生用它）、定义 LLM 结构化输出 schema、配置管理
LangGraph 场景里的选择

# 1. TypedDict —— 官方文档默认推荐，最轻量
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str

# 2. dataclass —— state 有方法或想用 . 访问时
@dataclass
class AgentState:
    messages: Annotated[list, add_messages] = field(default_factory=list)
    user_id: str = ""

# 3. Pydantic —— 需要校验（比如 state 字段来自不可控源、要强约束）
class AgentState(BaseModel):
    messages: Annotated[list, add_messages] = []
    user_id: str


LangGraph 三种都支持，但 TypedDict 是社区惯例——state 通常在受控流程里流转，校验开销没必要。Pydantic 一般留给”和外部世界打交道的边界”，比如工具入参/出参、API schema、LLM structured output。dataclass 在 LangGraph 里相对少见，除非你想给 state 挂方法。
按你做 agent infra 的视角，可以把这三个理解成不同的信任边界层：外部输入用 Pydantic 兜住校验，内部流转用 TypedDict 走轻量通道，纯本地值对象用 dataclass。​​​​​​​​​​​​​​​​

# 4. 直接用class
在 LeetCode 的算法题中，系统后台传给你的树节点是**真实的实例对象**。这意味着你的算法代码里必定充满了类似 `if node.left:` 或者 `return node.val` 这样的写法。

如果你用 `TypedDict` 来注解 `TreeNode`，这就相当于告诉你的代码编辑器：“嘿，传进来的这个变量是个字典。” 当你顺手敲下 `node.val` 的时候，你的 IDE（比如 VS Code）就会立刻给你划上红线报错：“字典没有 `val` 这个属性，你是不是想写 `node['val']`？”