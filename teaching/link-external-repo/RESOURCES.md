# Link External Repo Resources

## Knowledge

- [Pro Git 2nd ed. — Git Tools: Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
  官方书 submodule 章节：add、clone 后 init/update、指针更新、常见坑。第一站。
- [gitsubmodules(7) 概念文档](https://git-scm.com/docs/gitsubmodules)
  官方概念说明：gitlink（160000 mode 条目）+ `.gitmodules`，主仓库只记「哪个提交」，不存内容——体积判断的权威依据。
- [git-submodule(1) 手册](https://git-scm.com/docs/git-submodule)
  命令参考：`add` / `update --init` / `deinit` / `remove`。
- [contrib/subtree/git-subtree.adoc（git 仓库内官方文档）](https://github.com/git/git/blob/master/contrib/subtree/git-subtree.adoc)
  subtree 是 contrib 命令，不在 git-scm 书里（[为何移出书外](https://stackoverflow.com/questions/74493349/why-was-git-subtree-removed-from-the-git-scm-book)）；`--squash` 的语义以此为准。
- [Atlassian: git subtree tutorial](https://www.atlassian.com/git/tutorials/git-subtree)
  subtree 操作流程与「内容并入主仓库历史」的直观解释。
- [opensource.com: git submodules vs subtrees](https://opensource.com/article/20/5/git-submodules-subtrees)
  两者体积与协作成本的对比总结（submodule 主仓库小、subtree 主仓库大）。
- [GitHub Blog: Get up to speed with partial clone and shallow clone](https://github.blog/open-source/git/get-up-to-speed-with-partial-clone-and-shallow-clone/)
  `--filter=blob:none` 按需下载 blob：作为「使用方」克隆大仓库省磁盘/带宽的官方说明（Derrick Stolee）。
- [GitHub Blog: Highlights from Git 2.25](https://github.blog/open-source/git/highlights-from-git-2-25/)
  `git sparse-checkout` 命令化的发布公告，与 partial clone 配合的工作流示例。

## Wisdom (Communities)

- [Stack Overflow `git-submodule` 标签](https://stackoverflow.com/questions/tagged/git-submodules)
  submodule 的坑几乎都有人踩过；判断具体方案前先搜这里。
- [r/git](https://www.reddit.com/r/git/)
  活跃社区，工作流选型讨论多。

## Gaps

- 用户具体要关联哪个仓库、用途是什么——待补充，补齐后 mission 与后续课具体化
- Obsidian 场景下「gitignore + symlink 到外部 clone」与 vault 索引的相互作用，待需要时验证
