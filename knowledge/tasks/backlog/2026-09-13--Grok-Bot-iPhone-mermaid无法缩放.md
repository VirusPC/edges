---
name: grokbot_iphone_mermaid_no_zoom
description: 产品观察：Grok Bot iPhone 端 mermaid 不支持放大缩小，复杂图无法预览
metadata:
  edges-type: task
  edges-title: Grok Bot iPhone mermaid 无法缩放
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-13T12:02:00+08:00"
---

Grok Bot **iPhone** 客户端渲染的 mermaid 图不支持放大缩小（无 pinch-zoom / 无独立全屏可缩放预览），复杂图无法看清。

**Why:**
2026-09-13 peng cheng 在「任务记录员」对话里看任务依赖 mermaid（执行顺序图），手机上整图缩成一小块，节点文字不可读，只能看到骨架。桌面端可以看，手机端等于废了这类图。这是产品观察，不是 edges 仓内实现。

**How to apply:**
- 期望：手势能 pinch-zoom，或点开全屏后可平移缩放。
- 可对照桌面 / iPad 是否同样不能缩放。
- 需要官方改客户端；本条只留观察。若要走 Grok Bot 反馈通道另说一声。
- 在手机上交付复杂图时，暂时拆成几张小图或改列表，不要只丢一张大 mermaid。
