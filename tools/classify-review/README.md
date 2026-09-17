# Task Project classify — 拖拽复查页

单文件复查页：把 `project-tasks-classify` 的建议表摊开，**只能按住右侧任务拖到左侧分组**改归属。点左侧分组（不拖）只做筛选，不会赋值。

## 打开

任意静态方式即可，无需构建：

```bash
# macOS
open tools/classify-review/classify-suggestions.html

# Linux
xdg-open tools/classify-review/classify-suggestions.html

# 或起一个本地静态服务（嵌入式预览 / 自动化更稳）
python3 -m http.server 8765 --directory tools/classify-review
# 然后访问 http://127.0.0.1:8765/classify-suggestions.html
```

用浏览器打开后即可拖拽。表是当时的 open-board 快照，不是 live `tasks list`。改动写在 `localStorage`（键 `edges-classify-v7-pointer-drag`，带 `snapshotId`；表换一批时改 `SNAPSHOT_ID` 才会丢掉旧编辑）。调完用「复制 JSON」或「复制 Markdown 表」贴回 Agent，再走 `edges tasks update --project`。

## 验证拖拽

系统 Chrome + `puppeteer-core`：

```bash
npm install --prefix /tmp/classify-review-verify puppeteer-core
NODE_PATH=/tmp/classify-review-verify/node_modules node tools/classify-review/verify-drag.mjs
```

脚本会模拟 pointerdown/move/up，并断言左侧计数、卡片「归属」pill、toast，以及「点分组只筛选」。
