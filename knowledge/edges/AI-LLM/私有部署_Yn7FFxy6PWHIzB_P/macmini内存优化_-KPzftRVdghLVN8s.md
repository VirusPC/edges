# mac mini 内存优化



1. 对于搭载 16GB 内存的 M4 Mac mini 而言，经验在于：**按需手动限制 Docker 的内存分配（建议调至 4GB 以下），并及时清理不使用的 Ollama 模型，以防止虚拟机预占和交换内存（Swap）堆积。
    1. 限制 Docker 资源：在 Docker Desktop 设置中将 Memory 限制从目前的 8GB 调低至 2GB 或 4GB，因为你的 n8n 容器实际仅消耗约 233MB。
    2. 清理 AI 模型状态：通过终端执行 ollama stop 释放被本地大模型占用的统一内存。
    3. 重启系统：由于你目前的**交换内存（Swap）**已堆积至 7.49GB，重启是清空硬盘缓存并恢复系统响应速度的最快方式。







> 更新: 2026-03-12 03:14:41  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lh577zhlxkzuulwf>