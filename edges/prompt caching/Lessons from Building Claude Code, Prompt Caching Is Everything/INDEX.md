- Prompt caching makes long-running agents like Claude Code feasible by reusing prefixes to cut latency and cost dramatically.
    
- Order prompts for maximum prefix sharing: static system prompt and tools first, then project context, session context, and dynamic conversation messages last.
    
- Avoid breaking caches by never changing models, adding/removing tools, or updating static prompt content mid-session; use messages for updates like time or file changes instead.
    
- Design features around caching: implement plan mode via EnterPlanMode/ExitPlanMode tools rather than swapping tool sets, and defer tool loading with lightweight stubs instead of removal.
    
- For compaction when hitting context limits, fork with identical prefix, system prompt, and tools, appending compaction instructions as a new user message to preserve cache hits.