# 后期下载慢的问题

- [技术机制层](#%E6%8A%80%E6%9C%AF%E6%9C%BA%E5%88%B6%E5%B1%82)
- [为什么重启下载能暂时恢复](#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%87%8D%E5%90%AF%E4%B8%8B%E8%BD%BD%E8%83%BD%E6%9A%82%E6%97%B6%E6%81%A2%E5%A4%8D)
- [其他观察到的异常现象](#%E5%85%B6%E4%BB%96%E8%A7%82%E5%AF%9F%E5%88%B0%E7%9A%84%E5%BC%82%E5%B8%B8%E7%8E%B0%E8%B1%A1)
- [直接结论](#%E7%9B%B4%E6%8E%A5%E7%BB%93%E8%AE%BA)

---

**本质原因：这不是 Ollama 的 bug，是网络传输层面的多因素叠加** 。 [github](https://github.com/ollama/ollama/issues/1736)

## 技术机制层

1. **TCP 拥塞控制算法**\
   大文件下载后期，TCP 协议会因为累积的丢包或延迟波动触发拥塞窗口缩小，导致传输速率下降 。Ollama 本身是单线程 HTTP 下载，没有多连接并发能力，完全依赖 TCP 层表现。 [cloud.baidu](https://cloud.baidu.com/article/3561322)
2. **CDN 节点切换与动态限速**\
   Ollama 使用 Cloudflare R2 存储模型文件。CDN 在长时间传输后可能：
   * 触发单连接流量限制
   * 自动切换到负载较高的边缘节点
   * 应用 QoS（Quality of Service）策略降低优先级 [github](https://github.com/ollama/ollama/issues/3794)
3. **ISP 层面的流量整形**\
   运营商对持续大流量下载会启动动态限速（尤其宽带共享环境），目的是保障其他用户带宽。这在 99% 进度时最明显，因为累积流量已触发阈值 。 [github](https://github.com/ollama/ollama/issues/1736)

## 为什么重启下载能暂时恢复

* TCP 连接重建后，拥塞窗口重置为初始值（slow start 阶段），短期内恢复高速
* CDN 可能重新分配到空闲节点
* ISP 的限速策略基于"单次连续传输时长"，中断后计时器重置

**但这只是临时缓解**，并非根治——几分钟后速度仍会下降 。 [blog.csdn](https://blog.csdn.net/shaqilaixi2/article/details/146038722)

## 其他观察到的异常现象

* **进度回退**：下载到 60% 后倒退至 20%，是 CDN 节点切换时部分分片失效导致的重新校验 [github](https://github.com/ollama/ollama/issues/8484)
* **100% 后仍持续传输**：可能是元数据同步或完整性校验阶段，Ollama 进度条设计缺陷 [github](https://github.com/ollama/ollama/issues/1736)

## 直接结论

**这是 Ollama 架构选择的副作用**——为了简化部署（单二进制、零配置），牺牲了下载健壮性（无多线程、无智能重试、无本地 CDN 切换逻辑）。

**你的选项**：

1. **接受现状** + 用自动重启脚本对抗（性价比最高）
2. **切换下载方式**：手动从 Hugging Face/ModelScope 下载 GGUF 文件后用 `ollama create` 导入（一次性成本高，但避免反复折腾）
3. **等官方优化**：GitHub issue #1736、#10050 已持续 2 年未解决，短期内不会有根本性改进 [github](https://github.com/ollama/ollama/issues/10050)

如果你在国内且频繁下载模型，第二种方案实际更省时间。


> 更新: 2026-02-13 15:22:28  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pd1crqp8kala7awb>