# 从零到一的Langchain项目

- [第一步：环境初始化](#%E7%AC%AC%E4%B8%80%E6%AD%A5%E7%8E%AF%E5%A2%83%E5%88%9D%E5%A7%8B%E5%8C%96)
- [第二步：安装核心依赖](#%E7%AC%AC%E4%BA%8C%E6%AD%A5%E5%AE%89%E8%A3%85%E6%A0%B8%E5%BF%83%E4%BE%9D%E8%B5%96)
- [第三步：确保 Ollama 已启动并下载模型](#%E7%AC%AC%E4%B8%89%E6%AD%A5%E7%A1%AE%E4%BF%9D-ollama-%E5%B7%B2%E5%90%AF%E5%8A%A8%E5%B9%B6%E4%B8%8B%E8%BD%BD%E6%A8%A1%E5%9E%8B)
- [第四步：编写最简代码](#%E7%AC%AC%E5%9B%9B%E6%AD%A5%E7%BC%96%E5%86%99%E6%9C%80%E7%AE%80%E4%BB%A3%E7%A0%81)
- [第五步：运行项目](#%E7%AC%AC%E4%BA%94%E6%AD%A5%E8%BF%90%E8%A1%8C%E9%A1%B9%E7%9B%AE)
- [进阶一步：增加流式输出（Streaming）](#%E8%BF%9B%E9%98%B6%E4%B8%80%E6%AD%A5%E5%A2%9E%E5%8A%A0%E6%B5%81%E5%BC%8F%E8%BE%93%E5%87%BAstreaming)
- [为什么这么做？](#%E4%B8%BA%E4%BB%80%E4%B9%88%E8%BF%99%E4%B9%88%E5%81%9A)

---

<https://github.com/VirusPC/langchain-test>

背景：配置好了 **uv** 和 **Ollama**，这是目前最优雅、最现代的本地 AI 开发组合之一。

**uv** 的速度极快，管理环境比传统的 `pip` 或 `conda` 顺滑得多。

***

## 第一步：环境初始化

打开终端，使用 `uv` 创建项目文件夹并初始化虚拟环境。

```bash
# 创建并进入项目目录
mkdir my-langchain-app && cd my-langchain-app

# 初始化项目（这会生成 pyproject.toml）
uv init

# 创建虚拟环境（uv 会自动识别你的 Python 版本）
uv venv

# 激活环境 (macOS/Linux)
source .venv/bin/activate

```

***

## 第二步：安装核心依赖

我们将安装 LangChain 的核心库、社区扩展包（用于支持 Ollama）以及处理环境变量的工具。

```bash
uv add langchain langchain-community langchain-ollama

```

***

## 第三步：确保 Ollama 已启动并下载模型

在运行代码前，请确保你的本地 Ollama 服务正在运行，并且已经下载了你想要使用的模型（例如 `llama3` 或 `qwen2`）。

```bash
# 在另一个终端窗口运行（或者确保桌面应用已开启）
ollama pull llama3

```

***

## 第四步：编写最简代码

使用你常用的编辑器（比如 Cursor）创建一个名为 `main.py` 的文件，填入以下代码：

```python
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

# 1. 初始化本地模型
# 这里的 model 参数要和你 ollama pull 的名称一致
model = OllamaLLM(model="llama3")

# 2. 定义一个简单的提示词模板
prompt = ChatPromptTemplate.from_template("你是一个资深的 AI 助手。请简要回答关于 {topic} 的问题。")

# 3. 构建链（Chain）
# 使用 LCEL (LangChain Expression Language) 语法
chain = prompt | model

# 4. 运行并打印结果
if __name__ == "__main__":
    topic = "如何在 Mac mini 上部署本地大模型"
    print(f"--- 正在咨询 AI 关于 '{topic}' 的建议 ---\n")
    
    response = chain.invoke({"topic": topic})
    print(response)

```

***

## 第五步：运行项目

回到终端，使用 `uv` 运行你的脚本：

```bash
uv run main.py

```

***

## 进阶一步：增加流式输出（Streaming）

对于本地大模型，流式输出能极大提升交互体验。你可以将 `main.py` 的最后部分修改为：

```python
    # 流式输出
    for chunk in chain.stream({"topic": topic}):
        print(chunk, end="", flush=True)

```

***

## 为什么这么做？

* **uv**: 避开了复杂的环境路径问题，安装依赖几乎是瞬间完成。
* **OllamaLLM**: 相比旧版的 `Ollama` 类，这是 LangChain 官方目前推荐的专门适配 Ollama 的接口。
* **LCEL (**`|`**)**: 这种管道符语法是 LangChain 的精髓，它让你可以像搭积木一样把“提示词”、“模型”和“解析器”拼在一起。

**接下来的建议：**\
你现在的代码是“一问一答”模式。如果你想让它**记住之前的聊天记录**，或者**能够调用你 Mac mini 上的本地文件（RAG）**，我可以帮你继续完善代码，你想先试哪一个？


> 更新: 2026-02-14 08:41:14  
> 原文: <https://www.yuque.com/viruspc/el3mi0/bsupgb5xiz7agdqi>