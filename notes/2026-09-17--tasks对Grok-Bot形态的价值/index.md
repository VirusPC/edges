# tasks 对 Grok Bot 形态的价值

来源：peng cheng（2026-09-17，自登记电脑 H52HH2C4KC / MacBook Pro）。

## Idea

tasks 对 **Grok Bot 这种形态**还挺有用：不至于被某个聊的 topic 卡住，或者忘掉。

## Why（据口述展开）

- Grok Bot 会话多、角色多、话题容易漂移；单靠聊天上下文记「下一步做什么」会丢。
- 看板把工作项从某一次对话里抽出来，跨 bot / 跨天仍可捡起，降低「聊嗨了忘了办」和「被当前线程绑死」的风险。
- 与「edges 当外脑、bot memory 只作次级索引」一致：持久待办落 tasks，不堆在某个助手的会话记忆里。

## 边界

- 这是形态层体感，不是某张具体功能卡的实现说明。
- 交叉：`knowledge/projects/tasks/`、看板 `knowledge/tasks/`、Task Graph / 依赖与就绪队列相关 backlog。
