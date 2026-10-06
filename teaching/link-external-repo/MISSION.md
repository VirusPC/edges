# Mission: Link External Repo — 关联外部仓库而不撑大主仓库

## Why
维护 edges（公开 git 仓库）时，想把外部仓库关联进来（参考代码、配套项目等），但不想外部仓库的内容撑大主仓库的 `.git` 历史与克隆体积。需要一套可复用的判断：什么需求配什么方案。

## Success looks like
- 能分清两种体积——**主仓库历史体积**（提交进 `.git`，永久存在）与**本地磁盘占用**（工作区文件）——并说出各方案分别影响哪个
- 能为一次真实需求在 submodule / subtree / gitignore+clone / partial clone 中选出方案并讲清理由
- 会用 submodule 走完整流程：`add`、别人 clone 后 `update --init`、更新指针、移除
- 会用 `git count-objects -vH` 实测验证体积判断，而不是靠感觉

## Constraints
- 主仓库 edges 公开（github.com/VirusPC/edges），关联的外部仓库也必须可公开访问，凭据与内部仓库不进关联
- macOS（arm64），git 为日常命令行版本
- 中文教学；术语保留英文（submodule、gitlink、partial clone 等）

## Out of scope
- 包管理器层面的 git 依赖（npm git dependency 等），点到为止
- monorepo 工具链（Bazel、google repo 等）
