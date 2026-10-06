# Observation

知识库/Agent Observation 观测/观察系统（与 Evaluation 分开）。

<!-- project-memory-local:start -->
## 本层记忆

- [knowledge\_base\_observation\_system](<backlog/2026-09-13--%E7%9F%A5%E8%AF%86%E5%BA%93Observation%E7%B3%BB%E7%BB%9F/index.md>) — 为整个知识库建立 Observation 系统：能看到检索、更新与代理使用过程
- [langfuse\_public\_https](<backlog/2026-09-20--Langfuse-%E5%85%AC%E7%BD%91-HTTPS-%E6%9A%B4%E9%9C%B2%E5%8F%8D%E4%BB%A3%E8%AF%81%E4%B9%A6/index.md>) — v1 只走 Tailscale，用户设备不会一直开 Tailscale；需要公网 HTTPS 入口（反代\+证书）才能随时访问自建 Langfuse。
- [langfuse\_offsite\_backup](<backlog/2026-09-20--Langfuse-%E5%AE%9A%E6%9C%9F%E5%A4%87%E4%BB%BD%E5%88%B0%E5%8F%A6%E4%B8%80%E5%8F%B0NAS%E4%BA%91%E7%9B%98%E7%AD%89/index.md>) — v1 先用 docker named volumes \+ 偶尔打包，缺异地定期备份；需要把备份落到另一台（NAS/云盘等）以防单机丢失。
- [self\_hosted\_langfuse](<in_progress/2026-09-20--%E8%87%AA%E9%83%A8%E7%BD%B2-Langfuse/index.md>) — 缺少自有、可控的 LLM 观测后端；在自有云上跑起 Langfuse，供 Observation/评测接入，而不是只靠托管 SaaS。
<!-- project-memory-local:end -->
