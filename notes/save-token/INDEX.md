
1. https://github.com/rtk-ai/rtk 一个 Rust 写的 CLI 代理工具。原理很简单：AI 调用终端命令时，它会先把输出过滤压缩，再送进上下文。实测效果：cargo test：-95% token, git status：-80% token, grep / find：-60~90% token. 10 人团队每月能省 ~$1750 API 费用。
2. 