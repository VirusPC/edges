import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyBundledSkills } from "../../scripts/copy-bundled-skills.js";

const MOVED_SKILL_NAMES = [
  "paper-10-questions",
  "summarize-ai-article",
  "summarize-ai-article-ultra",
  "weekly-ai-blogs-digest",
  "horizontal-vertical-research",
  "learn-repo",
] as const;

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceSkills = path.resolve(here, "../../../skills");
const packageJsonPath = path.resolve(here, "../../package.json");

async function skillDirs(root: string): Promise<string[]> {
  const names = await readdir(root);
  return names
    .filter((name) => existsSync(path.join(root, name, "SKILL.md")))
    .sort();
}

test("copyBundledSkills copies every remaining extensions skill and not the six shared skills", async (t) => {
  const dest = await mkdtemp(path.join(tmpdir(), "edges-bundled-skills-"));
  t.after(() => rm(dest, { recursive: true, force: true }));
  const copied = copyBundledSkills(sourceSkills, dest);
  const expected = await skillDirs(sourceSkills);
  assert.deepEqual(expected, [
    "edges",
    "edges-conversation-to-notes",
    "edges-conversation-to-tasks",
    "edges-langfuse-agent-tracing",
    "edges-memory-add-type",
    "edges-memory-ask",
    "edges-memory-remember",
    "edges-onboarding",
    "edges-tasks-classify",
  ]);
  assert.deepEqual(copied, expected);
  assert.ok(expected.length > 0);
  for (const name of expected) {
    assert.equal(existsSync(path.join(dest, name, "SKILL.md")), true, name);
    assert.equal(MOVED_SKILL_NAMES.includes(name as (typeof MOVED_SKILL_NAMES)[number]), false, name);
  }
  for (const name of MOVED_SKILL_NAMES) {
    assert.equal(existsSync(path.join(dest, name)), false, name);
  }
  assert.equal(existsSync(path.join(dest, "README.md")), false);
  assert.equal(existsSync(path.join(dest, "AGENTS.md")), false);
});

function sectionAfter(markdown: string, heading: string): string {
  const marker = `\n${heading}\n`;
  const start = markdown.indexOf(marker);
  assert.ok(start >= 0, `missing ${heading}`);
  const body = markdown.slice(start + marker.length);
  const next = body.search(/\n#{2,3} /);
  return next === -1 ? body : body.slice(0, next);
}

function bashFences(section: string): string[] {
  return [...section.matchAll(/```bash\n([\s\S]*?)```/g)].map((match) => match[1] ?? "");
}

function fencedEdgesInitLines(section: string): string[] {
  return bashFences(section).flatMap((block) =>
    block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^edges\b/.test(line) && /\binit\b/.test(line)),
  );
}

test("onboarding and init docs recommend a project install without -g", async () => {
  const onboarding = await readFile(path.join(sourceSkills, "edges-onboarding/SKILL.md"), "utf8");
  assert.deepEqual(
    [...onboarding.matchAll(/^## .+$/gm)].map((match) => match[0]),
    ["## 何时用", "## 开始前提问", "## 接入流程"],
  );

  const flowIntro = sectionAfter(onboarding, "## 接入流程");
  assert.deepEqual(fencedEdgesInitLines(flowIntro), []);
  assert.match(flowIntro, /npm install -g @viruspc\/edges@latest\nedges --version\n/);

  const existingProject = sectionAfter(onboarding, "### 已有项目添加 edges harness 目录");
  const standaloneRepo = sectionAfter(onboarding, "### 创建独立 edges harness 仓库");
  const projectInits = [
    ...fencedEdgesInitLines(existingProject),
    ...fencedEdgesInitLines(standaloneRepo),
  ];
  assert.deepEqual(projectInits, [
    "edges --scope <目标目录> init -- -y",
    "edges --scope <仓库目录> --super init -- -y",
  ]);
  for (const command of projectInits) {
    assert.equal(command.split(/\s+/).includes("-g"), false, command);
    assert.equal(command.endsWith(" -- -y"), true, command);
  }
  assert.equal(/\binit\b[^\n]*-g|-g[^\n]*\binit\b/.test(existingProject), false);
  assert.equal(/\binit\b[^\n]*-g|-g[^\n]*\binit\b/.test(standaloneRepo), false);

  const trouble = sectionAfter(onboarding, "### 遇到问题");
  assert.match(trouble, /默认装当前项目，只有明确要用户级安装时才加 `-g`/);
  const recovery = [...trouble.matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1] ?? "")
    .filter((snippet) => /\binit\b/.test(snippet));
  assert.deepEqual(recovery, [
    "edges --scope <目标目录> skills init -- -y --agent <宿主标识>",
  ]);
  assert.equal(recovery[0]?.split(/\s+/).includes("-g"), false);

  const memoryInit = await readFile(path.join(sourceSkills, "edges/references/memory-init.md"), "utf8");
  assert.match(memoryInit, /edges --scope <目录> init -- -y\n/);
  assert.equal(memoryInit.includes("init -- -g -y"), false);
  assert.match(
    onboarding,
    /\| 给某个目录，例如为 monorepo 中的某个子包单独积累上下文 \| 已有项目添加 edges harness 目录 \|/,
  );
  assert.equal(onboarding.includes("为 monorepo 中的某个模块单独积累上下文"), false);
  const whenToUse = sectionAfter(onboarding, "## 何时用");
  const ask = sectionAfter(onboarding, "## 开始前提问");
  assert.match(whenToUse, /根据用户想做的事对照下表/);
  assert.equal(whenToUse.includes("开场的唯一菜单"), false);
  assert.match(ask, /第一步：问场景（含流程兜底）/);
  assert.match(ask, /不要把这两条流程当成开场的唯一菜单/);
  assert.match(ask, /第二步：补参数/);
  assert.match(ask, /创建个人大脑，长期保存笔记、知识与个人项目，记录 idea 和个人待办并追踪后续进展/);
  assert.match(ask, /接入已有大脑/);
  assert.match(ask, /7\. 已有项目添加 edges harness 目录/);
  assert.match(ask, /8\. 创建独立 edges harness 仓库/);
  assert.match(ask, /\| 已有项目添加 edges harness 目录 \| 目标目录 \|/);
  assert.equal(ask.includes("整个项目还是某个模块"), false);
});

test("the published package pins skills@1.7.2 and ships a skills directory", async () => {
  const pkg = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    files: string[];
    engines: { node: string };
    dependencies: Record<string, string>;
  };
  assert.ok(pkg.files.includes("dist"));
  assert.ok(pkg.files.includes("skills"));
  assert.equal(pkg.engines.node, ">=22.20.0");
  assert.equal(pkg.dependencies.skills, "1.7.2");
});
