## Python 异常处理

- **精准捕获优于泛型捕获**: 使用 `except urllib.error.URLError as e:` 而不是 `except Exception`,可以更清晰地处理特定错误[](https://docs.langchain.com/oss/python/langchain/quickstart)
    
- **as 关键字绑定异常对象**: `as e` 将异常实例赋值给变量,用于后续处理或日志记录[](https://docs.langchain.com/oss/python/langchain/quickstart)
    
- **Python vs TypeScript**: Python 可以指定捕获特定异常类型,而 TypeScript 只能捕获所有异常后手动判断类型[](https://docs.langchain.com/oss/python/langchain/quickstart)
    

## 编码处理

- **二进制到文本转换**: 网络请求返回的是 bytes,必须用 `decode()` 转换为字符串[](https://docs.langchain.com/oss/python/langchain/quickstart)
    
- **容错策略**: `errors="replace"` 确保遇到无效字节时不会抛出异常,而是用替换字符 `�` 代替[](https://docs.langchain.com/oss/python/langchain/quickstart)
    
- **自动化优势**: `requests` 库的 `resp.text` 自动处理编码,而 `urllib` 需要手动 decode[](https://docs.langchain.com/oss/python/langchain/quickstart)
    

## HTTP 客户端选择

- **urllib**: Python 标准库,无需安装,但 API 较冗长[](https://docs.langchain.com/oss/python/langchain/quickstart)
    
- **requests**: 第三方库,更简洁易用,是实际开发的主流选择[](https://docs.langchain.com/oss/python/langchain/quickstart)
    
- **上下文管理**: `urllib` 需要 `with` 语句管理连接,`requests` 自动处理