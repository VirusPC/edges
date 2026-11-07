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
    "edges --scope <仓库目录> init -- -y",
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
});

test("onboarding asks with user scenarios before offering setup flows", async () => {
  const onboarding = await readFile(path.join(sourceSkills, "edges-onboarding/SKILL.md"), "utf8");
  const opening = onboarding.split(/^## 接入流程$/m)[0] ?? "";
  const whenToUse = opening.split(/^## 何时用$/m)[1] ?? "";
  const options = whenToUse.split("\n").filter((line) => /^\d+\.\s/.test(line.trim()));
  assert.deepEqual(
    options.map((line) => line.trim()),
    [
      "1. 让整个正在做的项目记住约定、经验和接下来要做的事，记在这个项目所在的文件夹里。",
      "2. 只让某一个文件夹记住这一范围的内容。这个文件夹不必属于某个代码项目。",
      "3. 单独有一个地方，长期整理自己的笔记、知识和个人项目。",
      "4. 单独有一个地方，放经常要用的做法，让以后多个项目都能拿去用。",
      "5. 单独有一个地方，放团队共同的规范和经验，让各个项目都能用。",
    ],
  );
  for (const line of options) {
    assert.equal(/个人大脑|skills|挂载|harness|\.edges|Compose|Edges/i.test(line), false, line);
  }
  const phrases = [
    "第 1 项和第 2 项的差别是记整个项目，还是只记指定的一个文件夹",
    "不要再列成另一套选项让用户重选",
    "加到一个已经有的文件夹里",
    "新建一个单独的地方",
    "不是开场时的唯一菜单",
    "只做安装和验证",
  ];
  const afterOptions = whenToUse.slice(whenToUse.indexOf(options[4] ?? "") + (options[4]?.length ?? 0));
  let from = 0;
  for (const phrase of phrases) {
    const at = afterOptions.indexOf(phrase, from);
    assert.ok(at >= from, phrase);
    from = at + phrase.length;
  }
  assert.equal(whenToUse.includes("已有项目添加 .edges"), false);
  assert.equal(whenToUse.includes("仅安装并验证 CLI"), false);
  assert.equal(whenToUse.includes("只复述「场景」列"), false);
  assert.match(whenToUse, /用这些日常结果来问，让人听出用途和范围/);
  assert.match(opening, /只把当前选择确实还缺、上下文里没有的项集中问一轮/);
  assert.match(opening, /不要一上来堆文件夹路径、GitHub 账号和仓库名、公开还是私密/);
  assert.match(opening, /必须由用户明确选择，不能替用户假定/);
  assert.match(opening, /Agent 宿主从当前环境识别/);
  assert.match(opening, /不要默认它属于某个代码项目/);
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
