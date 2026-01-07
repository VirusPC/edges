# Edges

以知识沉淀为手段、以长期认知复利为目标的个人系统。

## 核心理念

知识的价值不取决于数量或完整性，而取决于它是否：
- 反复影响判断
- 提高成功概率
- 降低同类问题的思考成本

## 目录结构

- `notes/` - 未收敛、未定价的认知材料
- `edges/` - 已形成的判断优势
- `archive/` - 已失效或被吸收的内容
- `bin/` - 工具脚本

## 快速开始

```bash
# 将 bin 目录添加到 PATH
./bootstrap

# 重新加载 shell 配置
source ~/.zshrc  # 或 source ~/.bash_profile
```

## 工具

### edges-injest

AI 辅助内容导入脚本，自动创建分支、提交并生成 PR 链接。

```bash
edges-injest "标题" "内容正文" "AI Name <email>"
```

示例：
```bash
edges-injest "如何评估技术债" "技术债的评估需要考虑..." "Claude <claude@anthropic.com>"
```

脚本会：
1. 在 `inbox/` 创建 `YYYY-MM-DD--slug.md` 文件
2. 创建 `ingest/YYYY-MM-DD-slug` 分支并推送
3. 输出带预填 title/body 的 PR 创建链接（若 `gh` 已登录则自动创建 PR）
