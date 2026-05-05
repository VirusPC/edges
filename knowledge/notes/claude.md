I have a clear picture now. The user is asking about Claude Code’s team analytics dashboard, specifically the “AI 代码占比” (AI code percentage) metric. Let me give a focused answer.
Cheng,这指的是 Claude Code Analytics Dashboard 里的 Contribution Metrics（贡献指标）,需要打开 GitHub 集成才能看到。
它的核心思路不是统计 token 或会话数,而是通过 GitHub 集成,把团队合并的代码归因到「有 Claude Code 参与」和「没有 Claude Code 参与」两类,从而算出 AI 代码占比。具体两个口径:
	•	PRs with CC / PRs without CC:含 Claude Code 协助代码的 PR 数 vs 不含的 PR 数,按天统计已合并 PR ￼
	•	Lines of code with CC / without CC:在组织级别和用户级别上,统计有/无 Claude Code 协助合并的代码行数 ￼
几个关键的实现细节,Cheng 你应该会关心:
	1.	归因机制是保守的。这些指标被刻意设计得保守,代表 Claude Code 真实影响的低估值。只有高置信度判断为 Claude Code 参与的代码行和 PR 才会被计入。可以在 GitHub 端通过搜索带有 claude-code-assisted 标签的 PR 来查询这些数据 ￼。也就是说,它不是按 Claude 写过的所有 token 算,而是 PR 上打 label,落到合并代码上才算数。
	2.	开通条件。Owner 进入 claude.ai/admin-settings/claude-code,开启 Claude Code analytics,在同一页打开 “GitHub analytics” 开关,完成 GitHub 认证流程并选择要纳入分析的 GitHub 组织。开启后通常 24 小时内出现数据,每日更新 ￼。
	3.	覆盖范围有局限。Contribution metrics 处于公开 Beta,仅 Claude for Teams 和 Claude for Enterprise 计划可用,且只覆盖 claude.ai 组织内的用户。通过 Claude Console API 或第三方集成的使用不计入 ￼。API 客户在 Claude Console 看到的 dashboard 只有 usage 和 spend 指标,目前不提供带 GitHub 集成的 contribution metrics ￼。
所以”AI 代码占比”本质是个合并代码归因比例,而不是 IDE 里被接受的 suggestion 占比(那是另一个指标 Suggestion accept rate / Lines of code accepted)。这两个口径要分清:
	•	Lines of code accepted:在会话里点 Accept 的代码行(含未提交、后被删除的)
	•	Lines of code with CC(合并代码占比):真正进入 main 分支、能归因到 Claude 的行数
对你做研发资产平台度量的话,这套贡献指标的”高置信归因 + 保守低估”的设计哲学挺值得参考——它本质上是在解决多 agent 协作场景下的代码 provenance 问题。
参考文档:
	•	https://code.claude.com/docs/en/analytics
	•	https://support.claude.com/en/articles/12157520-claude-code-usage-analytics​​​​​​​​​​​​​​​​