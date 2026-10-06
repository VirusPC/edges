# Default

Ungrouped tasks that have not been assigned a named Task Project.

<!-- project-harness-local:start -->
## 本层组成
- [locomo\_official\_rag\_single\_file\_followup](<cancelled/2026-09-16--LoCoMo%E5%AE%98%E6%96%B9RAG%E5%8D%95%E6%A1%A3%E8%B7%9F%E8%BF%9B/index.md>) — LoCoMo 官方 RAG 单档（rag\-mode dialog、单一 top\-k）——冒烟基线过关后的可选跟进
- [project\-memory可扩展memory\-type](<done/2026-09-09--project-memory%E5%8F%AF%E6%89%A9%E5%B1%95memory-type/index.md>) — project\-memory 可扩展 memory type；如无必要勿增实体，可用目录\+skill 新增 type，未必需要单独 JSON
- [todos更名为tasks并支持状态流转](<done/2026-09-10--todos%E6%9B%B4%E5%90%8D%E4%B8%BAtasks%E5%B9%B6%E6%94%AF%E6%8C%81%E7%8A%B6%E6%80%81%E6%B5%81%E8%BD%AC/index.md>) — 工作项从 todos 更名为 tasks，并支持状态流转
- [todos需支持状态字段](<done/2026-09-10--todos%E9%9C%80%E6%94%AF%E6%8C%81%E7%8A%B6%E6%80%81%E5%AD%97%E6%AE%B5/index.md>) — todos 需要统一状态字段，以闭环「开发完后修改 TODO 状态」
- [cli\_refactor\_commanderjs](<done/2026-09-11--CLI%E7%94%A8Commanderjs%E9%87%8D%E6%9E%84/index.md>) — CLI 用 Commander.js 重构
- [bin\_cli\_skill\_layering](<done/2026-09-11--bin%E4%B8%8ECLI%E4%B8%8ESkill%E5%88%86%E5%B1%82/index.md>) — 对齐经典项目：能力面是 CLI \+ Skill 两层；仓根 bin/ 不作为给人的第三层
- [tasks\_skill\_crud\_status](<done/2026-09-11--tasks%E9%85%8D%E5%A5%97skill%E7%BB%9F%E4%B8%80CRUD%E4%B8%8E%E7%8A%B6%E6%80%81%E6%B5%81%E8%BD%AC/index.md>) — tasks 应提供配套 skill，统一增删改查与状态流转操作接口
- [task\_grouping\_like\_requirements](<done/2026-09-11--task%E8%BF%9B%E4%B8%80%E6%AD%A5%E5%88%86%E7%BB%84%E7%B1%BB%E9%9C%80%E6%B1%82%E7%AE%A1%E7%90%86/index.md>) — task 需要进一步分组；可能在 tasks/ 与状态夹之间再加一层需求目录
- [box\_obsidian\_preview\_artifacts](<done/2026-09-11--%E4%BA%91%E7%AB%AF%E7%94%B5%E8%84%91%E8%A3%85Obsidian%E9%A2%84%E8%A7%88artifacts/index.md>) — 在 Grok Bot 云端电脑安装 Obsidian，用于预览 artifacts（含 tasks 浏览）
- [user\_memory\_safe\_gitignore](<done/2026-09-11--%E5%AE%89%E5%85%A8%E5%BC%95%E5%85%A5user-memory%E4%B8%8Egitignore/index.md>) — 如何将 user memory 以安全方式引入体系（结合 .gitignore），并考虑仓删后仍留在本机用户目录
- [tasks\_requirement\_priority](<done/2026-09-13--tasks%E8%A1%A5%E5%85%85%E9%9C%80%E6%B1%82%E4%BC%98%E5%85%88%E7%BA%A7/index.md>) — Tasks 补充需求优先级概念：和状态、分组正交，用来排谁先做
- [show\_teach\_deploy\_status\_on\_repo\_home](<done/2026-09-14--%E4%BB%93%E5%BA%93%E4%B8%BB%E9%A1%B5%E5%B1%95%E7%A4%BAteach%E7%AB%99%E7%82%B9%E9%83%A8%E7%BD%B2%E7%8A%B6%E6%80%81/index.md>) — 仓库主页展示 Deploy teach site 部署状态：README 徽章 \+ workflow Environment
- [locomo\_fork\_thin\_wrap\_edges\_submodule](<done/2026-09-16--LoCoMo-fork%E8%96%84%E5%B0%81%E8%A3%85%E4%B8%8Eedges-submodule/index.md>) — LoCoMo fork 薄封装 \+ edges submodule，替换仓内 port harness
- [locomo\_eval\_pipeline\_smoke](<done/2026-09-16--LoCoMo%E8%AF%84%E6%B5%8B%E6%B5%81%E6%B0%B4%E7%BA%BF%E5%86%92%E7%83%9F/index.md>) — 先跑通 LoCoMo 评测流水线（写入→检索→作答→打分）；不把分数当 project\-memory 证据
- [root\_repo\_release\_since\_v1\_1\_0](<done/2026-09-20--%E6%A0%B9%E4%BB%93%E5%BA%93%E5%8F%91%E7%89%88%E8%87%AA-v110-%E8%B5%B7/index.md>) — 上次正式发版停在 v1.1.0（2026\-09\-09），距今约 11 天主线有不少能力变化未切版本；需要走一轮发版（定版本号、收 Unreleased、打 tag/release）。
<!-- project-harness-local:end -->
