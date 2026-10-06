# Project Memory

Project Memory 类型/索引/reshape/与 docs 边界等。

<!-- project-entries-local:start -->
## 本层内容

- [runa\-memory\-ask调用结果统计](<backlog/2026-09-08--runa-memory-ask%E8%B0%83%E7%94%A8%E7%BB%93%E6%9E%9C%E7%BB%9F%E8%AE%A1/index.md>) — 为 runa\-memory\-ask skill 补充「调用后最终结果」统计
- [memory需要assets资源目录](<backlog/2026-09-09--memory%E9%9C%80%E8%A6%81assets%E8%B5%84%E6%BA%90%E7%9B%AE%E5%BD%95/index.md>) — 为 project \`.memory\` 增加资源存档目录的想法
- [project\-memory跨agent继承经验](<backlog/2026-09-09--project-memory%E8%B7%A8agent%E7%BB%A7%E6%89%BF%E7%BB%8F%E9%AA%8C/index.md>) — Project Memory 的一个核心作用是跨 Agent / 账号切换时继承经验
- [project\_memory\_tree\_algorithm](<backlog/2026-09-10--project-memory%E6%98%AF%E6%A0%91%E7%BB%93%E6%9E%84%E7%AE%97%E6%B3%95/index.md>) — 整体从树理解 memory；不同 type 只是不同节点；与 page index 相通
- [reshape底层拆树原子操作](<backlog/2026-09-10--reshape%E5%BA%95%E5%B1%82%E6%8B%86%E6%A0%91%E5%8E%9F%E5%AD%90%E6%93%8D%E4%BD%9C/index.md>) — project\-memory reshape 后续重构方向：底层拆出树相关原子操作
- [memory\_entry\_private\_metadata](<backlog/2026-09-11--%E8%AE%B0%E5%BF%86%E6%9D%A1%E7%9B%AE%E5%8A%A0private%E5%85%83%E6%95%B0%E6%8D%AE/index.md>) — 记忆条目增加 private 元数据（从
- [reference\_description\_must\_include\_key\_urls](<backlog/2026-09-13--reference%E7%9A%84description%E5%BA%94%E5%B8%A6%E5%85%B3%E9%94%AE%E9%93%BE%E6%8E%A5/index.md>) — 写或改 .harness/memory/references 时，description 与类型入口索引行必须带可点击的关键 URL
- [clarify\_memory\_vs\_docs\_boundary](<backlog/2026-09-15--%E6%98%8E%E7%A1%AEmemory%E4%B8%8Edocs%E8%BE%B9%E7%95%8C/index.md>) — 明确 .memory 与 docs/ 的边界：成文给人读 vs 短记忆给维护者/agent
- [memory\_module\_decoupled\_pluggable\_interface](<backlog/2026-09-16--Memory%E6%A8%A1%E5%9D%97%E8%A7%A3%E8%80%A6%E4%B8%8E%E5%8F%AF%E6%8F%92%E6%8B%94%E6%8E%A5%E5%8F%A3/index.md>) — 框架解耦：Memory 模块接口明确，可接入多种 Memory 实现
- [memory\_query\_dropout\_random\_mask](<backlog/2026-09-16--%E8%AE%B0%E5%BF%86%E6%9F%A5%E8%AF%A2Dropout%E9%9A%8F%E6%9C%BA%E5%B1%8F%E8%94%BD/index.md>) — 查询/使用记忆时随机屏蔽一部分（类 Dropout），减轻过去记忆拉偏
- [reconsider\_reference\_memory\_type](<backlog/2026-09-17--%E9%87%8D%E6%96%B0%E8%AF%84%E4%BC%B0Reference-memory-type/index.md>) — 探讨 Reference 类型是否多余；外链/对照可否归入 Project、User 等其它 type
- [memory\_types\_configurable\_deposit\_templates](<backlog/2026-09-24--Memory%E5%90%84%E7%B1%BB%E5%9E%8B%E6%94%AF%E6%8C%81%E9%85%8D%E7%BD%AE%E6%B2%89%E6%B7%80%E6%A8%A1%E6%9D%BF/index.md>) — 所有 Memory 类型支持按类型配置 remember 使用的沉淀正文模板
- [dream\_auto\_memory\_to\_knowledge](<backlog/2026-09-27--dream-%E8%87%AA%E5%8A%A8%E6%95%B4%E7%90%86%E5%AF%B9%E8%AF%9D%E8%AE%B0%E5%BF%86%E5%B9%B6%E4%BA%A7%E7%94%9F%E7%9F%A5%E8%AF%86/index.md>) — 需要 dream：后台自动整理对话记忆并产出可复用知识（非手动复盘；非把 STAR 当复盘模板）。
- [predefined\-project\-memory\-distribution](<backlog/2026-10-05--%E6%8F%90%E4%BE%9B%E5%8F%AF%E5%88%86%E5%8F%91%E7%9A%84%E9%A2%84%E5%AE%9A%E4%B9%89-Project-Memory/index.md>) — 设计 extensions/memory 的预定义记忆分发，并以已确认的 Tasks 执行流程、CLI 操作约定及写作规范引用为首批内容。
- [edges\_repo\_isomorhic\_to\_memory](<done/2026-09-12--%E6%95%B4%E4%BB%93%E4%B8%8Ememory%E5%90%8C%E6%9E%84%E9%80%92%E5%BD%92%E8%9E%8D%E5%90%88/index.md>) — 基于 Project Memory 重构 Edges 目录架构，以 AGENTS.md 组织递归记忆，通过交叉引用形成 graph，明确跨层共享能力的归属，并完成相应迁移。
- [memory\_type\_indexes\_as\_folder\_agents\_md](<done/2026-09-17--memory%E7%B1%BB%E5%9E%8B%E7%B4%A2%E5%BC%95%E6%94%B9%E4%B8%BA%E7%9B%AE%E5%BD%95%E4%B8%8BAGENTS/index.md>) — 协议级改造：.memory 内类型索引改为类型目录下的 AGENTS.md（如 feedbacks/AGENTS.md），求一致与可扩展
- [project\_harness\_init\_skill](<backlog/2026-10-06--project-harness-init-skill/index.md>) — 把系统入口初始化做成 project harness init（演进或包装 project\-memory\-init），供用户对任意选定目录自行 init。
- [index\_md\_index\_md\_posts](<backlog/2026-10-06--%E8%84%9A%E6%9C%ACindexmd-%E8%BF%81-INDEXmd%E5%90%AB-posts/index.md>) — 可预览迁移脚本，套 CLI 树遍历，将内容叶子 index.md 改为 INDEX.md 并改引用；含 posts 仅改名。
<!-- project-entries-local:end -->
