
html = '''<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 对话知识沉淀系统 — 技术方案</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root,[data-theme="light"]{
  --color-bg:#f7f6f2;--color-surface:#f9f8f5;--color-surface-2:#fbfbf9;
  --color-surface-offset:#f0ede8;--color-border:#d4d1ca;--color-divider:#dcd9d5;
  --color-text:#28251d;--color-text-muted:#7a7974;--color-text-faint:#bab9b4;
  --color-primary:#01696f;--color-primary-hover:#0c4e54;--color-primary-bg:#cedcd8;
  --color-orange:#da7101;--color-orange-bg:#f5e4cf;
  --color-blue:#006494;--color-blue-bg:#c6d8e4;
  --color-purple:#7a39bb;--color-purple-bg:#dacfde;
  --color-success:#437a22;--color-success-bg:#d4dfcc;
  --color-warning:#964219;--color-warning-bg:#ddcfc6;
  --shadow-sm:0 1px 2px rgba(40,37,29,.06);--shadow-md:0 4px 12px rgba(40,37,29,.08);--shadow-lg:0 12px 32px rgba(40,37,29,.12);
  --radius-sm:.375rem;--radius-md:.5rem;--radius-lg:.75rem;--radius-xl:1rem;
  --font-body:'Inter','Helvetica Neue',sans-serif;
  --font-mono:'JetBrains Mono','Courier New',monospace;
}
[data-theme="dark"]{
  --color-bg:#171614;--color-surface:#1c1b19;--color-surface-2:#201f1d;
  --color-surface-offset:#222120;--color-border:#393836;--color-divider:#262523;
  --color-text:#cdccca;--color-text-muted:#797876;--color-text-faint:#5a5957;
  --color-primary:#4f98a3;--color-primary-hover:#227f8b;--color-primary-bg:#313b3b;
  --color-orange:#fdab43;--color-orange-bg:#564b3e;
  --color-blue:#5591c7;--color-blue-bg:#3a4550;
  --color-purple:#a86fdf;--color-purple-bg:#4e4652;
  --color-success:#6daa45;--color-success-bg:#3a4435;
  --color-warning:#bb653b;--color-warning-bg:#564942;
  --shadow-sm:0 1px 2px rgba(0,0,0,.2);--shadow-md:0 4px 12px rgba(0,0,0,.3);--shadow-lg:0 12px 32px rgba(0,0,0,.4);
}
@media(prefers-color-scheme:dark){:root:not([data-theme]){
  --color-bg:#171614;--color-surface:#1c1b19;--color-surface-2:#201f1d;
  --color-surface-offset:#222120;--color-border:#393836;--color-divider:#262523;
  --color-text:#cdccca;--color-text-muted:#797876;--color-text-faint:#5a5957;
  --color-primary:#4f98a3;--color-primary-bg:#313b3b;
  --color-orange:#fdab43;--color-orange-bg:#564b3e;
  --color-blue:#5591c7;--color-blue-bg:#3a4550;
  --color-purple:#a86fdf;--color-purple-bg:#4e4652;
  --color-success:#6daa45;--color-success-bg:#3a4435;
  --color-warning:#bb653b;--color-warning-bg:#564942;
}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;scroll-behavior:smooth;scroll-padding-top:5rem}
body{font-family:var(--font-body);font-size:clamp(.9375rem,.875rem + .25vw,1.0625rem);line-height:1.7;color:var(--color-text);background:var(--color-bg);min-height:100dvh}
h1,h2,h3,h4{line-height:1.25;font-weight:600}
code,pre{font-family:var(--font-mono)}
a{color:var(--color-primary);text-decoration:none}a:hover{color:var(--color-primary-hover)}

/* NAV */
nav{position:sticky;top:0;z-index:100;background:color-mix(in oklab,var(--color-bg) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--color-divider);padding:.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.nav-title{font-weight:700;font-size:clamp(.875rem,.8rem + .35vw,1rem);color:var(--color-text);display:flex;align-items:center;gap:.5rem}
.nav-badge{font-size:.6875rem;font-weight:600;padding:.15rem .5rem;background:var(--color-primary-bg);color:var(--color-primary);border-radius:999px;letter-spacing:.03em;text-transform:uppercase}
.nav-links{display:flex;gap:1.25rem;list-style:none}
.nav-links a{font-size:.8125rem;color:var(--color-text-muted);transition:color .18s;font-weight:500}
.nav-links a:hover{color:var(--color-primary)}
.theme-btn{width:32px;height:32px;border-radius:var(--radius-md);background:var(--color-surface-offset);border:1px solid var(--color-border);color:var(--color-text-muted);cursor:pointer;display:grid;place-items:center;transition:all .18s;flex-shrink:0}
.theme-btn:hover{background:var(--color-primary-bg);color:var(--color-primary)}

/* LAYOUT */
.page{max-width:1000px;margin:0 auto;padding:2.5rem 1.5rem 5rem}
section{margin-bottom:3.5rem}

/* HERO */
.hero{padding:3rem 0 2rem;border-bottom:1px solid var(--color-divider);margin-bottom:3rem}
.hero h1{font-size:clamp(1.75rem,1.2rem + 2.2vw,2.75rem);font-weight:700;letter-spacing:-.02em;margin-bottom:.75rem;line-height:1.15}
.hero p{font-size:clamp(1rem,.95rem + .25vw,1.125rem);color:var(--color-text-muted);max-width:62ch}
.hero-meta{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1.25rem}
.tag{font-size:.75rem;font-weight:600;padding:.25rem .75rem;border-radius:999px;letter-spacing:.04em;text-transform:uppercase}
.tag-primary{background:var(--color-primary-bg);color:var(--color-primary)}
.tag-blue{background:var(--color-blue-bg);color:var(--color-blue)}
.tag-purple{background:var(--color-purple-bg);color:var(--color-purple)}

/* SECTION HEADINGS */
h2{font-size:clamp(1.1rem,1rem + .5vw,1.35rem);font-weight:700;margin-bottom:1.25rem;padding-bottom:.625rem;border-bottom:2px solid var(--color-primary);display:inline-block;color:var(--color-text)}
h3{font-size:clamp(.975rem,.9rem + .35vw,1.1rem);font-weight:600;margin:.25rem 0 .875rem;color:var(--color-text)}
h4{font-size:.9rem;font-weight:600;color:var(--color-primary);margin:.1rem 0 .5rem;text-transform:uppercase;letter-spacing:.05em}

/* ARCH OVERVIEW */
.arch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-bottom:1.5rem}
.arch-card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:1.25rem 1.375rem;box-shadow:var(--shadow-sm)}
.arch-card-header{display:flex;align-items:center;gap:.625rem;margin-bottom:.75rem}
.arch-icon{width:32px;height:32px;border-radius:var(--radius-md);display:grid;place-items:center;font-size:.9rem;flex-shrink:0}
.icon-teal{background:var(--color-primary-bg);color:var(--color-primary)}
.icon-blue{background:var(--color-blue-bg);color:var(--color-blue)}
.icon-orange{background:var(--color-orange-bg);color:var(--color-orange)}
.icon-purple{background:var(--color-purple-bg);color:var(--color-purple)}
.arch-card h3{margin:0;font-size:.9375rem}
.arch-card p{font-size:.875rem;color:var(--color-text-muted);line-height:1.6;margin:0}

/* FLOW */
.flow{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem;margin:1.25rem 0 2rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:1.125rem 1.375rem}
.flow-step{display:flex;align-items:center;gap:.5rem}
.flow-num{width:26px;height:26px;border-radius:50%;background:var(--color-primary);color:#fff;font-size:.6875rem;font-weight:700;display:grid;place-items:center;flex-shrink:0}
.flow-label{font-size:.8125rem;font-weight:500;color:var(--color-text)}
.flow-arrow{color:var(--color-text-faint);font-size:.75rem}

/* HOOKS TABLE */
.hooks-table{width:100%;border-collapse:collapse;font-size:.875rem;background:var(--color-surface);border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--color-border);box-shadow:var(--shadow-sm);margin-bottom:2rem}
.hooks-table thead{background:var(--color-surface-offset)}
.hooks-table th{padding:.75rem 1rem;text-align:left;font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);border-bottom:1px solid var(--color-border)}
.hooks-table td{padding:.75rem 1rem;border-bottom:1px solid var(--color-divider);vertical-align:top;color:var(--color-text)}
.hooks-table tr:last-child td{border-bottom:none}
.hooks-table tr:hover td{background:var(--color-surface-2)}
.badge{display:inline-block;font-size:.6875rem;font-weight:600;padding:.15rem .55rem;border-radius:999px;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.badge-green{background:var(--color-success-bg);color:var(--color-success)}
.badge-blue{background:var(--color-blue-bg);color:var(--color-blue)}
.badge-orange{background:var(--color-orange-bg);color:var(--color-orange)}
.badge-gray{background:var(--color-surface-offset);color:var(--color-text-muted)}
.mono{font-family:var(--font-mono);font-size:.8rem;background:var(--color-surface-offset);padding:.1rem .35rem;border-radius:var(--radius-sm);white-space:nowrap}

/* CODE BLOCK */
.code-wrap{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;margin:1rem 0 1.75rem;box-shadow:var(--shadow-sm)}
.code-header{display:flex;align-items:center;justify-content:space-between;padding:.6rem 1rem;background:var(--color-surface-offset);border-bottom:1px solid var(--color-border)}
.code-lang{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-text-muted)}
.code-file{font-size:.75rem;color:var(--color-text-faint);font-family:var(--font-mono)}
pre{padding:1.125rem 1.25rem;overflow-x:auto;font-size:.8125rem;line-height:1.65;color:var(--color-text)}
.kw{color:var(--color-primary)}
.str{color:var(--color-orange)}
.cmt{color:var(--color-text-faint);font-style:italic}
.num{color:var(--color-blue)}
.key{color:var(--color-purple)}

/* TOOL SECTION */
.tool-header{display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;padding:1rem 1.25rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}
.tool-logo{width:36px;height:36px;border-radius:var(--radius-md);display:grid;place-items:center;font-weight:700;font-size:.9rem;color:#fff;flex-shrink:0}
.logo-claude{background:linear-gradient(135deg,#c97b3e,#e8953a)}
.logo-codex{background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid var(--color-border)}
.logo-opencode{background:linear-gradient(135deg,#0f4c75,#1b6ca8)}
.tool-info h3{margin:0 0 .2rem;font-size:1rem}
.tool-info p{margin:0;font-size:.8125rem;color:var(--color-text-muted)}
.hook-chips{display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:1.25rem}
.chip{font-size:.7rem;font-weight:600;padding:.25rem .65rem;border-radius:999px;border:1px solid;letter-spacing:.03em;cursor:default}
.chip-active{background:var(--color-primary-bg);color:var(--color-primary);border-color:var(--color-primary)}
.chip-warn{background:var(--color-warning-bg);color:var(--color-warning);border-color:var(--color-warning)}
.chip-gray{background:var(--color-surface-offset);color:var(--color-text-faint);border-color:var(--color-border);text-decoration:line-through}

/* SCHEMA */
.schema-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;margin:1rem 0 1.5rem}
.schema-field{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:.875rem 1rem}
.schema-key{font-family:var(--font-mono);font-size:.8rem;font-weight:600;color:var(--color-primary);margin-bottom:.3rem}
.schema-type{font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-faint);font-weight:600;margin-bottom:.3rem}
.schema-desc{font-size:.8125rem;color:var(--color-text-muted);line-height:1.5}

/* TIMELINE */
.timeline{border-left:2px solid var(--color-border);padding-left:1.5rem;margin:1rem 0 2rem;display:flex;flex-direction:column;gap:1.25rem}
.tl-item{position:relative}
.tl-dot{position:absolute;left:-1.875rem;top:.3rem;width:10px;height:10px;border-radius:50%;border:2px solid var(--color-primary);background:var(--color-primary-bg)}
.tl-event{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-primary);margin-bottom:.3rem}
.tl-tool{font-size:.7rem;color:var(--color-text-faint);margin-bottom:.4rem;font-weight:500}
.tl-desc{font-size:.875rem;color:var(--color-text-muted);line-height:1.6}

/* CALLOUT */
.callout{border-radius:var(--radius-lg);padding:1rem 1.25rem;margin:1.25rem 0;display:flex;gap:.875rem;border:1px solid}
.callout-warn{background:var(--color-warning-bg);border-color:var(--color-warning);color:var(--color-warning)}
.callout-info{background:var(--color-blue-bg);border-color:var(--color-blue);color:var(--color-blue)}
.callout-tip{background:var(--color-success-bg);border-color:var(--color-success);color:var(--color-success)}
.callout-icon{font-size:1.1rem;flex-shrink:0;margin-top:.05rem}
.callout-body{font-size:.875rem;line-height:1.6}
.callout-body strong{font-weight:700}
.callout-body p{margin:.3rem 0 0;opacity:.9}

/* STEPS */
.steps{counter-reset:step;display:flex;flex-direction:column;gap:.75rem;margin:1rem 0 1.75rem}
.step{counter-increment:step;display:flex;gap:.875rem;align-items:flex-start}
.step-num{width:28px;height:28px;flex-shrink:0;border-radius:50%;background:var(--color-primary);color:#fff;font-size:.75rem;font-weight:700;display:grid;place-items:center;margin-top:.1rem}
.step-body{flex:1}
.step-title{font-weight:600;font-size:.9375rem;margin-bottom:.25rem}
.step-desc{font-size:.875rem;color:var(--color-text-muted);line-height:1.6}

footer{text-align:center;padding:2rem 1.5rem;border-top:1px solid var(--color-divider);color:var(--color-text-faint);font-size:.8125rem}

@media(max-width:600px){
  .nav-links{display:none}
  .arch-grid{grid-template-columns:1fr}
  .schema-grid{grid-template-columns:1fr 1fr}
  .hooks-table{font-size:.8rem}
  .hooks-table th,.hooks-table td{padding:.625rem .75rem}
}
</style>
</head>
<body>

<nav>
  <div class="nav-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    AI 知识沉淀系统
    <span class="nav-badge">技术方案 v1</span>
  </div>
  <ul class="nav-links">
    <li><a href="#arch">架构</a></li>
    <li><a href="#hooks">Hook 时机</a></li>
    <li><a href="#schema">数据模型</a></li>
    <li><a href="#impl">实现</a></li>
    <li><a href="#deploy">部署</a></li>
  </ul>
  <button class="theme-btn" data-theme-toggle aria-label="切换主题">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  </button>
</nav>

<div class="page">

  <header class="hero">
    <h1>AI 对话知识自动沉淀系统</h1>
    <p>通过在 Claude Code、Codex CLI 和 OpenCode 的生命周期关键节点植入 Hook，自动捕获、评分、上报对话中有价值的知识，沉淀为结构化知识库。</p>
    <div class="hero-meta">
      <span class="tag tag-primary">Claude Code ✦ 23 Hooks</span>
      <span class="tag tag-blue">Codex CLI ✦ 3 Hooks</span>
      <span class="tag tag-purple">OpenCode ✦ Plugin API</span>
    </div>
  </header>

  <!-- 1. ARCHITECTURE -->
  <section id="arch">
    <h2>整体架构</h2>
    <div class="arch-grid">
      <div class="arch-card">
        <div class="arch-card-header">
          <div class="arch-icon icon-teal">🪝</div>
          <h3>采集层</h3>
        </div>
        <p>在各 AI 编码工具的生命周期节点注册 Hook，捕获原始对话事件（提问、回答、工具调用等）。</p>
      </div>
      <div class="arch-card">
        <div class="arch-card-header">
          <div class="arch-icon icon-orange">🧠</div>
          <h3>评分/检测层</h3>
        </div>
        <p>对每次对话单元进行知识价值评分：关键词匹配 + 回答长度 + 代码密度 + 问题类型分类。</p>
      </div>
      <div class="arch-card">
        <div class="arch-card-header">
          <div class="arch-icon icon-blue">📤</div>
          <h3>上报层</h3>
        </div>
        <p>将评分达标的知识单元通过 HTTP / 本地 SQLite / Markdown 文件持久化，支持同步与异步两种模式。</p>
      </div>
      <div class="arch-card">
        <div class="arch-card-header">
          <div class="arch-icon icon-purple">📚</div>
          <h3>沉淀层</h3>
        </div>
        <p>按项目、标签、时间线组织知识卡片，输出可检索的知识库（文件 / DB / Notion / Obsidian 等）。</p>
      </div>
    </div>

    <div class="flow">
      <div class="flow-step">
        <div class="flow-num">1</div>
        <div class="flow-label">用户发起提问</div>
      </div>
      <span class="flow-arrow">→</span>
      <div class="flow-step">
        <div class="flow-num">2</div>
        <div class="flow-label">Hook 捕获事件</div>
      </div>
      <span class="flow-arrow">→</span>
      <div class="flow-step">
        <div class="flow-num">3</div>
        <div class="flow-label">脚本评分知识价值</div>
      </div>
      <span class="flow-arrow">→</span>
      <div class="flow-step">
        <div class="flow-num">4</div>
        <div class="flow-label">上报埋点数据</div>
      </div>
      <span class="flow-arrow">→</span>
      <div class="flow-step">
        <div class="flow-num">5</div>
        <div class="flow-label">写入知识库</div>
      </div>
    </div>
  </section>

  <!-- 2. HOOK TIMING -->
  <section id="hooks">
    <h2>Hook 上报时机设计</h2>

    <div class="callout callout-tip">
      <span class="callout-icon">💡</span>
      <div class="callout-body">
        <strong>核心原则：</strong> 用最少的 Hook 组合覆盖完整的"问题 → 回答"生命周期，避免重复采集同一条知识。
        <p>推荐优先级：<code>UserPromptSubmit</code> + <code>Stop</code> 为主，<code>SessionStart</code> / <code>PostCompact</code> 为辅。</p>
      </div>
    </div>

    <h3>上报时机总览</h3>
    <div class="timeline">
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-event">SessionStart</div>
        <div class="tl-tool">Claude Code ✦ Cursor ✦ OpenCode</div>
        <div class="tl-desc">会话开始时记录元数据：项目路径、会话 ID、开始时间、模型版本。为本次会话生成唯一 trace_id，所有后续事件均关联此 ID。</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-event">UserPromptSubmit ⭐ 核心</div>
        <div class="tl-tool">Claude Code ✦ Cursor (beforeSubmitPrompt) ✦ OpenCode (before hook)</div>
        <div class="tl-desc">捕获用户提问原文、意图分类（feature / debug / architecture / learning）、关联文件路径。此时回答还未生成，先记录"问题侧"数据。</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-event">Stop ⭐ 核心</div>
        <div class="tl-tool">Claude Code ✦ Cursor (stop) ✦ Codex (task_end)</div>
        <div class="tl-desc">Claude 回答完毕时触发。此时可读取 last_assistant_message（回答摘要）和 transcript_path（完整对话文件），做知识价值评分并决定是否上报。这是最关键的知识提取节点。</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-event">PostCompact</div>
        <div class="tl-tool">Claude Code</div>
        <div class="tl-desc">上下文压缩后触发，compact_summary 字段包含整段对话的 AI 摘要。可直接把此摘要作为高密度知识条目上报，是"批量沉淀"的最佳时机。</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-event">PostToolUse (可选)</div>
        <div class="tl-tool">Claude Code ✦ Cursor</div>
        <div class="tl-desc">当 Claude 读取/写入特定文件（如架构设计文件、配置文件）时，记录"操作-文件-意图"三元组，用于构建代码知识图谱。</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-event">SessionEnd</div>
        <div class="tl-tool">Claude Code ✦ OpenCode</div>
        <div class="tl-desc">会话结束时统计本次会话总轮次、工具调用次数、知识沉淀数量，写入会话摘要。</div>
      </div>
    </div>

    <!-- Tool-by-tool breakdown -->
    <h3 id="claude-code-hooks">Claude Code — Hook 配置</h3>
    <div class="tool-header">
      <div class="tool-logo logo-claude">C</div>
      <div class="tool-info">
        <h3>Claude Code</h3>
        <p>最丰富的 Hook 生态，23 个事件，支持 command / http / prompt / agent 四种类型</p>
      </div>
    </div>
    <div class="hook-chips">
      <span class="chip chip-active">SessionStart ✦ 初始化</span>
      <span class="chip chip-active">UserPromptSubmit ✦ 捕获提问</span>
      <span class="chip chip-active">Stop ✦ 提取回答</span>
      <span class="chip chip-active">PostCompact ✦ 批量摘要</span>
      <span class="chip chip-warn">PostToolUse ✦ 可选</span>
      <span class="chip chip-active">SessionEnd ✦ 会话统计</span>
      <span class="chip chip-gray">PreToolUse ✦ 不需要</span>
    </div>

    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">JSON</span>
        <span class="code-file">.claude/settings.json</span>
      </div>
      <pre><span class="kw">{</span>
  <span class="key">"hooks"</span><span class="kw">:</span> <span class="kw">{</span>

    <span class="cmt">// ① 会话开始 — 初始化 trace_id，记录项目元数据</span>
    <span class="key">"SessionStart"</span><span class="kw">:</span> [<span class="kw">{</span>
      <span class="key">"hooks"</span><span class="kw">:</span> [<span class="kw">{</span>
        <span class="key">"type"</span><span class="kw">:</span> <span class="str">"command"</span><span class="kw">,</span>
        <span class="key">"command"</span><span class="kw">:</span> <span class="str">"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh"</span>
      <span class="kw">}]</span>
    <span class="kw">}]</span><span class="kw">,</span>

    <span class="cmt">// ② 用户提交提问时 — 捕获 prompt + 意图分类</span>
    <span class="key">"UserPromptSubmit"</span><span class="kw">:</span> [<span class="kw">{</span>
      <span class="key">"hooks"</span><span class="kw">:</span> [<span class="kw">{</span>
        <span class="key">"type"</span><span class="kw">:</span> <span class="str">"command"</span><span class="kw">,</span>
        <span class="key">"command"</span><span class="kw">:</span> <span class="str">"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/capture-prompt.sh"</span><span class="kw">,</span>
        <span class="key">"async"</span><span class="kw">:</span> <span class="num">true</span>  <span class="cmt">// 异步，不阻塞 Claude 响应</span>
      <span class="kw">}]</span>
    <span class="kw">}]</span><span class="kw">,</span>

    <span class="cmt">// ③ Claude 回答完毕 — 核心知识提取点</span>
    <span class="key">"Stop"</span><span class="kw">:</span> [<span class="kw">{</span>
      <span class="key">"hooks"</span><span class="kw">:</span> [<span class="kw">{</span>
        <span class="key">"type"</span><span class="kw">:</span> <span class="str">"command"</span><span class="kw">,</span>
        <span class="key">"command"</span><span class="kw">:</span> <span class="str">"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/extract-knowledge.sh"</span><span class="kw">,</span>
        <span class="key">"async"</span><span class="kw">:</span> <span class="num">true</span>
      <span class="kw">}]</span>
    <span class="kw">}]</span><span class="kw">,</span>

    <span class="cmt">// ④ 上下文压缩后 — 提取高密度摘要（批量沉淀）</span>
    <span class="key">"PostCompact"</span><span class="kw">:</span> [<span class="kw">{</span>
      <span class="key">"hooks"</span><span class="kw">:</span> [<span class="kw">{</span>
        <span class="key">"type"</span><span class="kw">:</span> <span class="str">"command"</span><span class="kw">,</span>
        <span class="key">"command"</span><span class="kw">:</span> <span class="str">"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/compact-knowledge.sh"</span><span class="kw">,</span>
        <span class="key">"async"</span><span class="kw">:</span> <span class="num">true</span>
      <span class="kw">}]</span>
    <span class="kw">}]</span><span class="kw">,</span>

    <span class="cmt">// ⑤ 可选：文件写入后记录操作-文件-意图三元组</span>
    <span class="key">"PostToolUse"</span><span class="kw">:</span> [<span class="kw">{</span>
      <span class="key">"matcher"</span><span class="kw">:</span> <span class="str">"Write|Edit"</span><span class="kw">,</span>
      <span class="key">"hooks"</span><span class="kw">:</span> [<span class="kw">{</span>
        <span class="key">"type"</span><span class="kw">:</span> <span class="str">"command"</span><span class="kw">,</span>
        <span class="key">"command"</span><span class="kw">:</span> <span class="str">"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/track-file-op.sh"</span><span class="kw">,</span>
        <span class="key">"async"</span><span class="kw">:</span> <span class="num">true</span>
      <span class="kw">}]</span>
    <span class="kw">}]</span>
  <span class="kw">}</span>
<span class="kw">}</span></pre>
    </div>

    <h3>Codex CLI — Hook 配置</h3>
    <div class="tool-header">
      <div class="tool-logo logo-codex" style="color:#a0c4ff;font-size:.75rem;font-weight:700">OAI</div>
      <div class="tool-info">
        <h3>Codex CLI</h3>
        <p>目前 3 个 Hook（task_start / task_step / task_end），处于 beta 阶段，覆盖任务级粒度</p>
      </div>
    </div>
    <div class="hook-chips">
      <span class="chip chip-active">task_start ✦ 任务开始</span>
      <span class="chip chip-active">task_end ✦ 核心提取点</span>
      <span class="chip chip-warn">task_step ✦ 中间过程（可选）</span>
    </div>

    <div class="callout callout-info">
      <span class="callout-icon">ℹ️</span>
      <div class="callout-body">
        <strong>Codex 适配策略：</strong> 因为 Codex 没有逐条消息的 Hook，改为在 <code>task_end</code> 时读取 transcript 文件，用脚本逐条解析消息对提取知识，等同于 Claude Code 的 <code>Stop</code> Hook 批量版本。
      </div>
    </div>

    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">JSON</span>
        <span class="code-file">codex-hooks.json / ~/.codex/config.json</span>
      </div>
      <pre><span class="kw">{</span>
  <span class="key">"hooks"</span><span class="kw">:</span> <span class="kw">{</span>
    <span class="key">"task_start"</span><span class="kw">:</span> <span class="str">"~/.codex/hooks/task-start.sh"</span><span class="kw">,</span>
    <span class="key">"task_end"</span><span class="kw">:</span>   <span class="str">"~/.codex/hooks/task-end.sh"</span>
  <span class="kw">}</span>
<span class="kw">}</span></pre>
    </div>

    <h3>OpenCode — Plugin API</h3>
    <div class="tool-header">
      <div class="tool-logo logo-opencode">OC</div>
      <div class="tool-info">
        <h3>OpenCode</h3>
        <p>事件驱动的 Plugin 系统，TypeScript/JS 插件，支持 before/after 工具执行钩子</p>
      </div>
    </div>
    <div class="hook-chips">
      <span class="chip chip-active">session.create ✦ 初始化</span>
      <span class="chip chip-active">message.after ✦ 回答提取</span>
      <span class="chip chip-warn">tool.after ✦ 工具操作（可选）</span>
      <span class="chip chip-active">session.end ✦ 会话统计</span>
    </div>

    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">TypeScript</span>
        <span class="code-file">.opencode/plugins/knowledge-tracker/index.ts</span>
      </div>
      <pre><span class="kw">import</span> <span class="kw">{</span> definePlugin <span class="kw">}</span> <span class="kw">from</span> <span class="str">"opencode/plugin"</span><span class="kw">;</span>

<span class="kw">export default</span> definePlugin<span class="kw">({</span>
  <span class="key">name</span><span class="kw">:</span> <span class="str">"knowledge-tracker"</span><span class="kw">,</span>

  <span class="key">hooks</span><span class="kw">:</span> <span class="kw">{</span>
    <span class="cmt">// 会话开始</span>
    <span class="key">"session.create"</span><span class="kw">:</span> <span class="kw">async</span> (ctx) <span class="kw">=></span> <span class="kw">{</span>
      ctx.state.traceId <span class="kw">=</span> crypto.randomUUID()<span class="kw">;</span>
      ctx.state.startTime <span class="kw">=</span> Date.now()<span class="kw">;</span>
    <span class="kw">},</span>

    <span class="cmt">// 每条消息回答完毕后触发</span>
    <span class="key">"message.after"</span><span class="kw">:</span> <span class="kw">async</span> (ctx) <span class="kw">=></span> <span class="kw">{</span>
      <span class="kw">if</span> (ctx.message.role <span class="kw">!==</span> <span class="str">"assistant"</span>) <span class="kw">return;</span>
      <span class="kw">const</span> score <span class="kw">=</span> scoreKnowledge(ctx.message.content)<span class="kw">;</span>
      <span class="kw">if</span> (score <span class="kw">>=</span> <span class="num">0.6</span>) <span class="kw">{</span>
        <span class="kw">await</span> reportKnowledgeUnit<span class="kw">({</span>
          traceId<span class="kw">:</span> ctx.state.traceId<span class="kw">,</span>
          prompt<span class="kw">:</span>  ctx.prevUserMessage<span class="kw">,</span>
          answer<span class="kw">:</span>  ctx.message.content<span class="kw">,</span>
          score<span class="kw">,</span>
          project<span class="kw">:</span> ctx.cwd
        <span class="kw">});</span>
      <span class="kw">}</span>
    <span class="kw">},</span>
  <span class="kw">}</span>
<span class="kw">});</span></pre>
    </div>
  </section>

  <!-- 3. DATA SCHEMA -->
  <section id="schema">
    <h2>统一数据模型</h2>
    <p style="color:var(--color-text-muted);font-size:.9rem;margin-bottom:1.25rem">三个工具的 Hook 脚本均将数据归一化为同一结构，上报到统一接口或本地存储。</p>

    <div class="schema-grid">
      <div class="schema-field">
        <div class="schema-key">id</div>
        <div class="schema-type">string · UUID</div>
        <div class="schema-desc">知识单元唯一标识</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">trace_id</div>
        <div class="schema-type">string</div>
        <div class="schema-desc">会话追踪 ID，关联同一会话的所有事件</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">source</div>
        <div class="schema-type">enum</div>
        <div class="schema-desc">claude_code / codex / opencode / cursor</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">timestamp</div>
        <div class="schema-type">string · ISO 8601</div>
        <div class="schema-desc">事件触发时间（含时区）</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">project</div>
        <div class="schema-type">string</div>
        <div class="schema-desc">项目目录路径或名称</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">intent_type</div>
        <div class="schema-type">enum</div>
        <div class="schema-desc">feature / debug / architecture / learning / convention</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">prompt</div>
        <div class="schema-type">string</div>
        <div class="schema-desc">用户问题原文（可选：脱敏处理）</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">answer_summary</div>
        <div class="schema-type">string</div>
        <div class="schema-desc">回答摘要（前 500 字或 last_assistant_message）</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">knowledge_score</div>
        <div class="schema-type">float · 0~1</div>
        <div class="schema-desc">知识价值评分，≥0.6 才上报</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">tags</div>
        <div class="schema-type">string[]</div>
        <div class="schema-desc">自动提取的技术标签（语言、框架、概念）</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">tools_used</div>
        <div class="schema-type">string[]</div>
        <div class="schema-desc">本轮使用的工具（Read/Edit/Bash…）</div>
      </div>
      <div class="schema-field">
        <div class="schema-key">file_paths</div>
        <div class="schema-type">string[]</div>
        <div class="schema-desc">涉及的文件路径（用于代码图谱关联）</div>
      </div>
    </div>

    <h3>知识价值评分算法</h3>
    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">Python</span>
        <span class="code-file">hooks/scorer.py</span>
      </div>
      <pre><span class="kw">def</span> score_knowledge(prompt: str, answer: str) <span class="kw">-></span> float<span class="kw">:</span>
    score <span class="kw">=</span> <span class="num">0.0</span>

    <span class="cmt"># 1. 回答长度（越长通常越有价值）</span>
    score <span class="kw">+=</span> min(len(answer) / <span class="num">2000</span>, <span class="num">0.25</span>)

    <span class="cmt"># 2. 含代码块（+0.2）</span>
    <span class="kw">if</span> <span class="str">"```"</span> <span class="kw">in</span> answer<span class="kw">:</span>
        score <span class="kw">+=</span> <span class="num">0.20</span>

    <span class="cmt"># 3. 知识类关键词匹配</span>
    KW_PATTERNS <span class="kw">=</span> [
        <span class="str">"定义|definition"</span><span class="kw">,</span> <span class="str">"原则|principle"</span><span class="kw">,</span> <span class="str">"约定|convention"</span><span class="kw">,</span>
        <span class="str">"架构|architecture"</span><span class="kw">,</span> <span class="str">"最佳实践|best practice"</span><span class="kw">,</span>
        <span class="str">"为什么|why"</span><span class="kw">,</span> <span class="str">"如何|how to"</span><span class="kw">,</span> <span class="str">"区别|difference"</span>
    ]
    matches <span class="kw">=</span> sum(<span class="num">1</span> <span class="kw">for</span> kw <span class="kw">in</span> KW_PATTERNS <span class="kw">if</span> re.search(kw, prompt <span class="kw">+</span> answer, re.I))
    score <span class="kw">+=</span> min(matches <span class="kw">*</span> <span class="num">0.08</span>, <span class="num">0.30</span>)

    <span class="cmt"># 4. Q&A 问答结构（prompt 以问号结尾 +0.1）</span>
    <span class="kw">if</span> prompt.strip().endswith(<span class="str">("?", "？")</span>)<span class="kw">:</span>
        score <span class="kw">+=</span> <span class="num">0.10</span>

    <span class="cmt"># 5. 包含列举/步骤结构 (+0.15)</span>
    <span class="kw">if</span> re.search(<span class="str">r"(\n[-*]|\n\d+\.)"</span>, answer)<span class="kw">:</span>
        score <span class="kw">+=</span> <span class="num">0.15</span>

    <span class="kw">return</span> round(min(score, <span class="num">1.0</span>), <span class="num">2</span>)</pre>
    </div>
  </section>

  <!-- 4. IMPLEMENTATION -->
  <section id="impl">
    <h2>核心脚本实现</h2>

    <h3>① Stop Hook — 核心知识提取脚本</h3>
    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">Bash</span>
        <span class="code-file">.claude/hooks/extract-knowledge.sh</span>
      </div>
      <pre><span class="kw">#!/bin/bash</span>
<span class="cmt"># 从 stdin 读取 Claude Code Stop 事件</span>
INPUT=$(cat)
SESSION_ID=$(echo <span class="str">"$INPUT"</span>  | jq -r <span class="str">'.session_id'</span>)
LAST_MSG=$(echo   <span class="str">"$INPUT"</span>  | jq -r <span class="str">'.last_assistant_message // ""'</span>)
TRANSCRIPT=$(echo <span class="str">"$INPUT"</span>  | jq -r <span class="str">'.transcript_path'</span>)
CWD=$(echo        <span class="str">"$INPUT"</span>  | jq -r <span class="str">'.cwd'</span>)

<span class="cmt"># 读取上一条用户提问（从 transcript 倒数第二个用户消息）</span>
PROMPT=$(jq -r <span class="str">'select(.type=="user") | .message.content[0].text'</span> \
    <span class="str">"$TRANSCRIPT"</span> | tail -<span class="num">2</span> | head -<span class="num">1</span>)

<span class="cmt"># 调用 Python 评分器</span>
SCORE=$(python3 ~/.claude/hooks/scorer.py \
    <span class="str">"$PROMPT"</span> <span class="str">"$LAST_MSG"</span>)

<span class="cmt"># 评分 >= 0.6 才上报</span>
<span class="kw">if</span> (( $(echo <span class="str">"$SCORE >= 0.6"</span> | bc -l) )); then
    python3 ~/.claude/hooks/reporter.py \
        --session-id  <span class="str">"$SESSION_ID"</span>  \
        --source      <span class="str">"claude_code"</span>  \
        --project     <span class="str">"$CWD"</span>         \
        --prompt      <span class="str">"$PROMPT"</span>      \
        --answer      <span class="str">"$LAST_MSG"</span>    \
        --score       <span class="str">"$SCORE"</span>
<span class="kw">fi</span>
<span class="kw">exit</span> <span class="num">0</span></pre>
    </div>

    <h3>② Reporter — 统一上报模块</h3>
    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">Python</span>
        <span class="code-file">~/.claude/hooks/reporter.py</span>
      </div>
      <pre><span class="kw">import</span> argparse, json, uuid, sqlite3, requests
<span class="kw">from</span> datetime <span class="kw">import</span> datetime, timezone
<span class="kw">from</span> pathlib  <span class="kw">import</span> Path
<span class="kw">from</span> scorer   <span class="kw">import</span> score_knowledge, extract_tags

ENDPOINT <span class="kw">=</span> <span class="str">"http://localhost:7788/api/knowledge"</span>  <span class="cmt"># 本地或远程接口</span>
DB_PATH  <span class="kw">=</span> Path.home() / <span class="str">".knowledge/db.sqlite"</span>

<span class="kw">def</span> build_unit(args) <span class="kw">-></span> dict<span class="kw">:</span>
    <span class="kw">return</span> <span class="kw">{</span>
        <span class="str">"id"</span><span class="kw">:</span>             str(uuid.uuid4())<span class="kw">,</span>
        <span class="str">"trace_id"</span><span class="kw">:</span>      args.session_id<span class="kw">,</span>
        <span class="str">"source"</span><span class="kw">:</span>        args.source<span class="kw">,</span>
        <span class="str">"timestamp"</span><span class="kw">:</span>     datetime.now(timezone.utc).isoformat()<span class="kw">,</span>
        <span class="str">"project"</span><span class="kw">:</span>       Path(args.project).name<span class="kw">,</span>
        <span class="str">"prompt"</span><span class="kw">:</span>        args.prompt[:<span class="num">1000</span>]<span class="kw">,</span>   <span class="cmt"># 截断保护</span>
        <span class="str">"answer_summary"</span><span class="kw">:</span> args.answer[:<span class="num">500</span>]<span class="kw">,</span>
        <span class="str">"knowledge_score"</span><span class="kw">:</span> float(args.score)<span class="kw">,</span>
        <span class="str">"tags"</span><span class="kw">:</span>           extract_tags(args.prompt, args.answer)<span class="kw">,</span>
        <span class="str">"intent_type"</span><span class="kw">:</span>    detect_intent(args.prompt)<span class="kw">,</span>
    <span class="kw">}</span>

<span class="kw">def</span> report(unit: dict)<span class="kw">:</span>
    <span class="cmt"># 1. 本地 SQLite 持久化（始终执行）</span>
    save_to_sqlite(unit)
    <span class="cmt"># 2. 可选：HTTP 上报到中心服务</span>
    <span class="kw">try</span><span class="kw">:</span>
        requests.post(ENDPOINT, json=unit, timeout=<span class="num">3</span>)
    <span class="kw">except</span> Exception<span class="kw">:</span>
        <span class="kw">pass</span>  <span class="cmt"># 上报失败不阻断流程，本地已有备份</span>

<span class="kw">if</span> __name__ <span class="kw">==</span> <span class="str">"__main__"</span><span class="kw">:</span>
    parser <span class="kw">=</span> argparse.ArgumentParser()
    <span class="kw">for</span> arg <span class="kw">in</span> [<span class="str">"session-id"</span><span class="kw">,</span><span class="str">"source"</span><span class="kw">,</span><span class="str">"project"</span><span class="kw">,</span><span class="str">"prompt"</span><span class="kw">,</span><span class="str">"answer"</span><span class="kw">,</span><span class="str">"score"</span>]<span class="kw">:</span>
        parser.add_argument(<span class="str">f"--{arg}"</span>)
    report(build_unit(parser.parse_args()))</pre>
    </div>

    <h3>③ Codex CLI task_end 脚本</h3>
    <div class="code-wrap">
      <div class="code-header">
        <span class="code-lang">Bash</span>
        <span class="code-file">~/.codex/hooks/task-end.sh</span>
      </div>
      <pre><span class="kw">#!/bin/bash</span>
<span class="cmt"># Codex 在 task_end 时传入 transcript 路径</span>
INPUT=$(cat)
TRANSCRIPT=$(echo <span class="str">"$INPUT"</span> | jq -r <span class="str">'.transcript_path // ""'</span>)

<span class="kw">if</span> [[ -f <span class="str">"$TRANSCRIPT"</span> ]]; then
    <span class="cmt"># 解析 transcript，逐对 Q&A 提取知识</span>
    python3 ~/.codex/hooks/parse-transcript.py \
        --source    <span class="str">"codex"</span>         \
        --file      <span class="str">"$TRANSCRIPT"</span>   \
        --project   <span class="str">"$(pwd)"</span>
<span class="kw">fi</span>
<span class="kw">exit</span> <span class="num">0</span></pre>
    </div>
  </section>

  <!-- 5. DEPLOYMENT -->
  <section id="deploy">
    <h2>部署与接入方式</h2>

    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-body">
          <div class="step-title">创建 Hook 脚本目录</div>
          <div class="step-desc">将所有脚本放入 <code>~/.claude/hooks/</code>（用户全局生效），或各项目下的 <code>.claude/hooks/</code>。执行 <code>chmod +x *.sh</code> 赋予可执行权限。</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-body">
          <div class="step-title">配置 settings.json</div>
          <div class="step-desc">将上方的 Claude Code / Codex / OpenCode Hook 配置写入对应的配置文件，在 Claude Code 中通过 <code>/hooks</code> 命令验证配置是否生效。</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-body">
          <div class="step-title">初始化本地 SQLite 数据库</div>
          <div class="step-desc">运行 <code>python3 ~/.claude/hooks/reporter.py --init-db</code> 创建 <code>~/.knowledge/db.sqlite</code>，不依赖网络，确保离线场景下数据不丢失。</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">4</div>
        <div class="step-body">
          <div class="step-title">（可选）启动本地知识服务</div>
          <div class="step-desc">用 FastAPI / Node.js 起一个 <code>localhost:7788</code> 的轻量服务，接收 Hook 上报数据，并提供知识检索 API，前端可对接 Obsidian、Notion 或自研 Dashboard。</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">5</div>
        <div class="step-body">
          <div class="step-title">验证与调试</div>
          <div class="step-desc">Claude Code 用 <code>--debug</code> 模式或 <code>Ctrl+O</code> 查看 Hook 输出；Codex 查看 stderr；OpenCode 用插件日志。检查 SQLite 中是否有新增记录。</div>
        </div>
      </div>
    </div>

    <h3>上报目标对比</h3>
    <table class="hooks-table">
      <thead>
        <tr>
          <th>上报目标</th>
          <th>适用场景</th>
          <th>延迟</th>
          <th>离线支持</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="mono">本地 SQLite</span></td>
          <td>个人/团队基础存储，始终兜底</td>
          <td><span class="badge badge-green">&lt;1ms</span></td>
          <td>✅</td>
        </tr>
        <tr>
          <td><span class="mono">Markdown 文件</span></td>
          <td>接入 Obsidian / Notion 知识库</td>
          <td><span class="badge badge-green">&lt;5ms</span></td>
          <td>✅</td>
        </tr>
        <tr>
          <td><span class="mono">HTTP 本地服务</span></td>
          <td>自研 Dashboard / 团队共享</td>
          <td><span class="badge badge-blue">&lt;10ms</span></td>
          <td>⚠️ 需服务在线</td>
        </tr>
        <tr>
          <td><span class="mono">HTTP 远程接口</span></td>
          <td>多人协作、云端知识库</td>
          <td><span class="badge badge-orange">~100ms</span></td>
          <td>❌ 需网络</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-warn">
      <span class="callout-icon">⚠️</span>
      <div class="callout-body">
        <strong>安全提示：</strong> Hook 脚本以当前用户权限运行，请勿将含密钥、密码的 prompt 原文上报到远程服务。建议在 <code>reporter.py</code> 中对 <code>prompt</code> 做正则脱敏（去除 env 变量、token 等）后再上报。
      </div>
    </div>
  </section>

</div>

<footer>AI 对话知识沉淀系统技术方案 · 支持 Claude Code / Codex CLI / OpenCode · 2026</footer>

<script>
(function(){
  const t=document.querySelector('[data-theme-toggle]'),r=document.documentElement;
  let d=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
  r.setAttribute('data-theme',d);
  const sun='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moon='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  if(t){
    t.innerHTML=d==='dark'?sun:moon;
    t.addEventListener('click',()=>{
      d=d==='dark'?'light':'dark';
      r.setAttribute('data-theme',d);
      t.innerHTML=d==='dark'?sun:moon;
    });
  }
})();
</script>
</body>
</html>'''

with open('/root/knowledge-system-tech-spec.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("HTML written, length:", len(html))
