# Edges CLI Platform

edges CLI/脚手架/发布/鉴权等平台层。

<!-- project-memory-local:start -->
## 本层记忆

- [CLI与MCP需加鉴权](<backlog/2026-09-09--CLI%E4%B8%8EMCP%E9%9C%80%E5%8A%A0%E9%89%B4%E6%9D%83/index.md>) — CLI 与 MCP 后续需要加鉴权（产品/基建待办）
- [system\_project\_or\_user\_home](<backlog/2026-09-12--%E7%B3%BB%E7%BB%9F%E5%8F%AF%E8%B7%9F%E9%A1%B9%E7%9B%AE%E6%88%96%E6%8C%82%E7%94%A8%E6%88%B7%E7%9B%AE%E5%BD%95/index.md>) — 系统很通用：可跟随项目，也可放到用户目录（tasks 可做用户级）；像 Claude Code auto memory 的扩展
- [project\_memory\_scripts\_to\_edges\_cli](<backlog/2026-09-13--project-memory%E8%84%9A%E6%9C%AC%E8%BF%81%E5%88%B0edges-CLI/index.md>) — 把 project\-memory\-init/remember/ask/doctor 等 Python scripts 迁到 edges CLI
- [publish\_edges\_cli\_as\_package](<backlog/2026-09-14--edges-CLI%E5%8F%91%E5%B8%83%E6%88%90package/index.md>) — 把 edges CLI 发布成 package，可安装而不是只在仓里跑
- [encapsulate\_edges\_as\_scaffold\_and\_framework](<backlog/2026-09-16--edges-%E5%B0%81%E8%A3%85%E4%B8%BA%E8%84%9A%E6%89%8B%E6%9E%B6%E6%A1%86%E6%9E%B6%E5%B9%B6%E5%AE%9A%E4%B9%89%E5%8D%87%E7%BA%A7%E8%B7%AF%E5%BE%84/index.md>) — 脚手架管出生、框架管版本升级；非纯 template；knowledge/ 不同步
- [project\_memory\_tree\_operations\_as\_cli](<backlog/2026-09-24--project-memory-%E6%A0%91%E7%BB%93%E6%9E%84%E6%93%8D%E4%BD%9C%E5%B0%81%E8%A3%85%E4%B8%BACLI/index.md>) — 将 project\-memory 的树结构操作（至少含找最近父节点）封装成 edges CLI，避免散落在 skill 或脚本里
- [node\-immutability](<backlog/2026-10-05--%E8%8A%82%E7%82%B9%E6%A8%A1%E5%9E%8B%E4%B8%8E%E6%93%8D%E4%BD%9C%E7%BB%93%E6%9E%9C%E7%9A%84-immutable-%E4%BC%98%E5%8C%96/index.md>) — 当前 Node 采用原地更新；后续评估 immutable 与实例生命周期，普通优先级，不阻塞递归节点重构。
- [extensions\_clis\_extensions\_cli](<done/2026-09-29--%E6%8A%8A-extensionsclis-%E6%94%B9%E5%90%8D%E4%B8%BA-extensionscli/index.md>) — 目录实际是一套统一 edges 命令，复数名容易让人以为有多套 CLI。
- [edges\_cli\_command](<done/2026-09-30--%E8%B7%91%E9%80%9A-edges-cli-%E5%AE%8C%E6%95%B4%E7%BC%96%E8%AF%91%E4%BF%AE%E5%A5%BD-command-%E5%AD%97%E6%AE%B5%E6%92%9E%E8%BD%A6/index.md>) — 拆开装 nginx 结果里两个都叫 command 的字段，让 pnpm \-\-filter edges\-cli build 通过。
- [edges\_cli\_scope](<done/2026-10-01--%E4%B8%BA-Edges-CLI-%E5%BB%BA%E7%AB%8B%E7%BB%9F%E4%B8%80%E7%9A%84%E5%B7%A5%E4%BD%9C-scope-%E8%A7%A3%E6%9E%90/index.md>) — 基于递归记忆模型，先解析本次工作 scope，再确定操作归属、适用上下文和读写位置，使共享 CLI 能力可服务不同作用域。

- [commands\-service\-decoupling](<backlog/2026-10-06--%E8%A7%A3%E8%80%A6-CLI-commands-%E4%B8%8E-Service/index.md>) — 明确命令适配与完整业务用例的边界，移除 Service 对 CLI 上下文的依赖，整理审阅页与 Artifacts 编排。
<!-- project-memory-local:end -->
