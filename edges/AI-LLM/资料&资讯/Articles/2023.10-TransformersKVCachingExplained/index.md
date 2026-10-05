# 2023.10 - Transformers KV Caching Explained

- [关键点](#%E5%85%B3%E9%94%AE%E7%82%B9)

---



写作如何通过缓存键值状态加速生成式Transformer模型的推理速度。

### 关键点
+ KV缓存用于存储生成式Transformer模型中用于计算缩放点积注意力的键（Key）和值（Value）状态，从而避免重复计算，提高推理速度。
+ KV缓存仅适用于解码器部分，例如GPT模型或T5的解码器，而非非生成式模型如BERT。
+ 在自回归生成过程中，解码器只需计算新生成的令牌的注意力，而无需重复计算之前的令牌注意力。
+ KV缓存优化显著减少矩阵大小，从而加快矩阵运算，但需要占用更多GPU VRAM或CPU RAM。
+ 使用KV缓存生成1000个新令牌的速度显著快于未使用缓存的情况，实验结果表明推理时间减少约5倍。
+ Transformers库默认启用KV缓存，建议开发者在使用模型时保持这一设置。











[https://medium.com/@joaolages/kv-caching-explained-276520203249](https://medium.com/@joaolages/kv-caching-explained-276520203249)



> 更新: 2025-08-04 06:33:28  
> 原文: <https://www.yuque.com/viruspc/el3mi0/xyh36b2g2r5p4kno>