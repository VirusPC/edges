import { CONSTRAINTS_END, CONSTRAINTS_START } from "../../domain/config/sections.js";
import { INIT_MODULE_NAMES, type InitModuleName } from "./modules.js";

/** ADR 0059 主旨。受管片段用注释定界，正文与 ADR 定稿一致。 */
export const CONSTRAINT_PREAMBLE =
  "材料放在本层 `.edges/` 下各类型的目录里，以 `.edges/README` 的登记为准，只认已经初始化的类型。读写都走 `edges` skill，按类型用 `edges <模块>`，不要手改受管理的目录和索引。提问或动手之前，按当前任务的相关性，从该类型的根目录到相关子目录逐层查；本轮已经查过、输入也没变，就不再重复查。沉淀遵守该类型既有的创建与审批规则；识别出候选不等于获准落盘。";

/** ADR 0059 特殊点。顺序即官方呈现顺序。 */
export const CONSTRAINT_POINTS: Record<InitModuleName, string> = {
  memory:
    "只改文案时不查。用户要求记住、纠正你、给出约定，或结论已经验证时才沉淀。个人偏好和密钥只进 `user`；不检索就会做错事的规则，直接写进硬约束区块。",
  notes:
    "话题可能已经有笔记时先查；同一主题的就更新原笔记，不新开。识别出候选可以提议一次，用户同意了才写。",
  skills:
    "动手前先查本层的 managed 技能，有就照着做；`referenced` 只当索引，不改它的正文。同一串步骤做到第二遍时可以提议沉淀，用户同意了才写；沉淀的是流程，结论放进记忆。",
  tasks:
    "提到待办、进度、下一步，或者要新开任务时先查；同一个意图已经有卡就沿用。可以写成文字提议开卡，背景和目标要有对话依据。",
  routines:
    "提到定时、周期或例行工作，或者要新建、改动例程时先查；同一职责已经有了就更新。识别出候选可以提议一次，用户同意了才写。",
  projects:
    "给任务、笔记选主题前先查；有合适的就归进去，没有就不硬归。识别出该新建或该调整归类的候选，可以提议一次，用户同意了才写。",
};

export const CONSTRAINT_POINT_ORDER: readonly InitModuleName[] = [
  "memory",
  "notes",
  "skills",
  "tasks",
  "routines",
  "projects",
];

/** 仍等于这些旧官方句子时，刷新成主旨；改过的句子不在此列。 */
const PREVIOUS_OFFICIAL_LINES = [
  "本目录有项目记忆。提问或动手前用 `$edges-memory-ask`；该沉淀用 `$edges-memory-remember`。本轮查过不重复。",
  "本层硬约束直接写在这个区块里，不要链到记忆正文文件。",
  "本层硬约束直接写在这个区块里，不要通过记忆正文链接代替本区块的硬约束。",
];

const SEED_MARK = (id: string) => `<!-- edges-seed:${id} -->`;

function isInitModule(name: string): name is InitModuleName {
  return (INIT_MODULE_NAMES as readonly string[]).includes(name);
}

function stripPreviousOfficialLines(inner: string): string {
  const kept = inner.split("\n").filter((line) => {
    const text = line.trim().replace(/^- /, "").trim();
    return !PREVIOUS_OFFICIAL_LINES.includes(text);
  });
  return kept.join("\n");
}

function blockEnd(inner: string, from: number): number {
  const next = inner.indexOf("<!-- edges-seed:", from);
  return next < 0 ? inner.length : next;
}

function replaceBlock(inner: string, id: string, official: string): string {
  const marker = SEED_MARK(id);
  const at = inner.indexOf(marker);
  const bodyStart = inner.indexOf("\n", at);
  const end = blockEnd(inner, bodyStart + 1);
  return `${inner.slice(0, bodyStart + 1)}${official}\n${inner.slice(end)}`;
}

function insertBlock(inner: string, id: string, official: string, afterId: string | null): string {
  const piece = `${SEED_MARK(id)}\n${official}\n`;
  if (afterId && inner.includes(SEED_MARK(afterId))) {
    const markerAt = inner.indexOf(SEED_MARK(afterId));
    const bodyStart = inner.indexOf("\n", markerAt);
    const end = blockEnd(inner, bodyStart + 1);
    const prefix = inner[end - 1] === "\n" ? "" : "\n";
    return inner.slice(0, end) + prefix + piece + inner.slice(end);
  }
  const heading = inner.indexOf("## 本层硬约束");
  if (heading >= 0) {
    const lineEnd = inner.indexOf("\n", heading);
    const at = lineEnd < 0 ? inner.length : lineEnd + 1;
    const prefix = at > 0 && inner[at - 1] === "\n" ? "" : "\n";
    return inner.slice(0, at) + prefix + piece + inner.slice(at);
  }
  return piece + inner;
}

function ensureSeed(inner: string, id: string, official: string, afterId: string | null): string {
  const marker = SEED_MARK(id);
  const at = inner.indexOf(marker);
  if (at < 0) return insertBlock(inner, id, official, afterId);
  const bodyStart = inner.indexOf("\n", at);
  const end = blockEnd(inner, bodyStart + 1);
  const raw = inner.slice(bodyStart + 1, end);
  if (raw.trim() !== official) return inner;
  if (raw === `${official}\n`) return inner;
  return replaceBlock(inner, id, official);
}

/** 主旨只写一次；已初始化类型补特殊点。等于官方原文才刷新，改过的句子不动。 */
export function applyOfficialConstraintSeed(document: string, modules: readonly string[]): string {
  const start = document.indexOf(CONSTRAINTS_START);
  const end = document.indexOf(CONSTRAINTS_END);
  if (start < 0 || end < start) return document;
  const selected = modules.filter(isInitModule);
  let inner = stripPreviousOfficialLines(document.slice(start + CONSTRAINTS_START.length, end));
  inner = ensureSeed(inner, "preamble", CONSTRAINT_PREAMBLE, null);
  let previous = "preamble";
  for (const id of CONSTRAINT_POINT_ORDER) {
    if (!selected.includes(id)) {
      if (inner.includes(SEED_MARK(id))) previous = id;
      continue;
    }
    inner = ensureSeed(inner, id, CONSTRAINT_POINTS[id], previous);
    previous = id;
  }
  inner = normalizeSeed(inner, "preamble", CONSTRAINT_PREAMBLE);
  for (const id of CONSTRAINT_POINT_ORDER) {
    if (inner.includes(SEED_MARK(id))) inner = normalizeSeed(inner, id, CONSTRAINT_POINTS[id]);
  }
  return document.slice(0, start + CONSTRAINTS_START.length) + inner + document.slice(end);
}

function normalizeSeed(inner: string, id: string, official: string): string {
  const marker = SEED_MARK(id);
  const at = inner.indexOf(marker);
  if (at < 0) return inner;
  const bodyStart = inner.indexOf("\n", at);
  const end = blockEnd(inner, bodyStart + 1);
  const raw = inner.slice(bodyStart + 1, end);
  if (raw.trim() !== official || raw === `${official}\n`) return inner;
  return replaceBlock(inner, id, official);
}
