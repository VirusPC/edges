#!/usr/bin/env -S node --import tsx
import { isWithinPath } from '../extensions/cli/src/utils/filesystem.js';
import { LegacyIndex as InternalNode } from "./legacy-index.mjs";
/** Reviewed Edges instance migration; generic Project Memory owns format conversion. */
import * as fs from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import * as generic from "../extensions/cli/src/services/memory/migrate.js";
import {
  isFile,
  isDirectory,
  isSymlink,
  readText,
  resolveTarget,
  ownershipTarget,
} from "../extensions/cli/src/services/memory/paths.js";
import {
  layerTypeSpecs,
  parseTypeMeta,
} from "../extensions/cli/src/services/memory/types.js";
import { expectedIndexDocument } from "../extensions/cli/src/services/memory/entries.js";
import { readIndexTemplate } from "../extensions/cli/src/services/memory/templates.js";
import type { LegacyType } from "../extensions/cli/src/services/memory/migration-legacy.js";
const JOURNAL = ".recursive-layout-migration";
export const OWNER_MAP: Record<string, string> = {
  ".": ".",
  extensions: "extensions",
  "extensions/skills/project-memory-init":
    "extensions/skills/project-memory-init",
  "shared-extensions": "shared-extensions",
  "knowledge/tasks": ".harness/tasks",
  "knowledge/notes": "knowledge/notes",
  evaluation: ".harness/evaluation",
  "knowledge/teaching": "teaching",
};
const DIRECTORIES: Record<string, string> = {
  "knowledge/projects": "projects",
  "knowledge/teaching": "teaching",
  evaluation: ".harness/evaluation",
  observation: ".harness/observation",
  "knowledge/tasks": ".harness/tasks",
};
interface ReviewedFile {
  source: string;
  target: string;
  sha256: string;
  sidecar?: ReviewedFile | null;
}
interface Gitlink {
  source: string;
  target: string;
  sha: string;
}
export interface InstanceManifest {
  privateOwnerMap?: Record<string, string>;
  tasks?: ReviewedFile[];
  localMemoryRecords?: ReviewedFile[];
  taskAssets?: ReviewedFile[];
  protectedPostHashes?: Record<string, string>;
  gitlink?: Gitlink;
}
interface InstanceDirectory {
  target: string;
  mode: number;
  beforeMode: number | null;
  sources: { source: string; mode: number }[];
}
export interface InstanceJob {
  directories: InstanceDirectory[];
  private: string[];
  watchedSources: string[];
  operations: generic.MigrationOperation[];
  diagnostics: generic.MigrationDiagnostic[];
  gitlink: Gitlink | null;
  legacyOwners: string[];
  protected: Record<string, string>;
  phase: string;
  root?: string;
}
const git = (root: string, ...args: string[]) =>
  execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
const hash = (path: string) => generic.sha(fs.readFileSync(path));
const privatePath = (path: string) =>
  path.includes(".memory/users") ||
  path.includes(".harness/memory/users") ||
  path.endsWith("/.memory/USER.md");
function block(text: string, name: string, body?: string) {
  return text.replace(
    new RegExp(
      `<!-- project-memory-${name}:start -->[\\s\\S]*?<!-- project-memory-${name}:end -->`,
      "g",
    ),
    () =>
      body === undefined
        ? ""
        : `<!-- project-memory-${name}:start -->\n${body}\n<!-- project-memory-${name}:end -->`,
  );
}
function stripScope(text: string) {
  for (const n of ["local", "children"]) text = block(text, n);
  return text
    .replaceAll("<!-- project-memory:start -->", "")
    .replaceAll("<!-- project-memory:end -->", "");
}
/** Union raw YAML fields; unsupported keys and conflicting values require review. */
export function mergeIndexMetadata(
  left: string,
  right: string,
): [string, string] {
  const typePattern =
      /<!-- project-memory-type:start -->\r?\n([\s\S]*?)<!-- project-memory-type:end -->/,
    frontPattern = /^\s*---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
  function extract(text: string) {
    const match = text.match(typePattern);
    let body = text.replace(typePattern, "");
    const front = body.match(frontPattern);
    if (front) body = body.slice(front[0].length);
    return [
      match?.[1] ?? "",
      front ? front[1] + "\n" : "",
      body.replace(/^[\r\n]+/, ""),
    ] as const;
  }
  function unionFields(first: string, second: string) {
    const fields = new Map<string, string>(),
      comments: string[] = [];
    for (const document of [first, second]) {
      for (const line of document.split(/\r?\n/)) {
        if (
          !line.trim() ||
          line.trimStart().startsWith("#") ||
          /^\s/.test(line)
        )
          continue;
        if (!/^[A-Za-z_][A-Za-z0-9_.-]*:/.test(line))
          throw new Error("index-metadata-structure-needs-review");
      }
      const matches = [...document.matchAll(/^([A-Za-z_][A-Za-z0-9_.-]*):/gm)],
        preamble = matches.length
          ? document.slice(0, matches[0]!.index)
          : document;
      if (
        preamble
          .split(/\r?\n/)
          .some((l) => l.trim() && !l.trimStart().startsWith("#"))
      )
        throw new Error("index-metadata-structure-needs-review");
      if (preamble.trim() && !comments.includes(preamble))
        comments.push(preamble);
      const local = new Set<string>();
      for (const [i, m] of matches.entries()) {
        const key = m[1]!,
          value = document
            .slice(m.index, matches[i + 1]?.index ?? document.length)
            .replace(/[\r\n]+$/, "");
        if (local.has(key) || (fields.has(key) && fields.get(key) !== value))
          throw new Error(`index-metadata-conflict: ${key}`);
        local.add(key);
        if (!fields.has(key)) fields.set(key, value);
      }
    }
    return (
      comments.join("") + [...fields.values()].map((v) => v + "\n").join("")
    );
  }
  const [lt, lf, lb] = extract(left),
    [rt, rf, rb] = extract(right),
    types = unionFields(lt, rt),
    front = unionFields(lf, rf);
  let header = front ? `---\n${front}---\n\n` : "";
  if (types)
    header += `<!-- project-memory-type:start -->\n${types}<!-- project-memory-type:end -->\n\n`;
  return [header + lb, rb];
}
export function makeInstancePlan(
  root: string,
  manifest: InstanceManifest,
): InstanceJob {
  const owners = manifest.privateOwnerMap ?? OWNER_MAP;
  if (
    Object.keys(owners).length !== Object.keys(OWNER_MAP).length ||
    Object.entries(OWNER_MAP).some(([k, v]) => owners[k] !== v)
  )
    throw new Error("private-owner-map-differs-from-reviewed-instance");
  const legacy: string[] = [];
  for (const { base, dirs } of generic.walk(root, true)) {
    for (const n of [JOURNAL, ".superpowers"]) {
      const i = dirs.indexOf(n);
      if (i >= 0) dirs.splice(i, 1);
    }
    if (dirs.includes(".memory")) {
      const owner = relative(root, base) || ".";
      if (!(owner in owners)) throw new Error(`unknown-legacy-owner: ${owner}`);
      legacy.push(owner);
    }
  }
  const ignore = join(root, ".gitignore");
  generic.safeAncestors(ignore, root);
  if (isSymlink(ignore) || (fs.existsSync(ignore) && !isFile(ignore)))
    throw new Error("unsafe-gitignore");
  const fullLegacy =
    isDirectory(join(root, ".memory")) &&
    readText(join(root, "AGENTS.md")).includes("](.memory/");
  const memory: {
    operations: generic.MigrationOperation[];
    diagnostics: generic.MigrationDiagnostic[];
    directoryMap: Pick<
      generic.MigrationDirectory,
      "source" | "target" | "mode"
    >[];
    private: string[];
  } = fullLegacy
    ? generic.planMigration(root, true)
    : {
        operations: [] as generic.MigrationOperation[],
        diagnostics: [] as generic.MigrationDiagnostic[],
        directoryMap: [] as Pick<
          generic.MigrationDirectory,
          "source" | "target" | "mode"
        >[],
        private: [] as string[],
      };
  const exact = new Map<string, string>(),
    expected: ReviewedFile[] = [];
  for (const group of ["tasks", "localMemoryRecords", "taskAssets"] as const)
    for (const item of manifest[group] ?? []) {
      exact.set(item.source, item.target);
      expected.push(item);
      if (group === "tasks" && item.sidecar?.sha256) {
        exact.set(item.sidecar.source, item.sidecar.target);
        expected.push(item.sidecar);
      }
    }
  const publicLegacy = expected.some((i) =>
    fs.existsSync(join(root, i.source)),
  );
  for (const item of publicLegacy ? expected : []) {
    const source = join(root, item.source);
    if (fs.existsSync(source) && hash(source) !== item.sha256)
      throw new Error(`reviewed-source-hash-mismatch: ${item.source}`);
    if (!fs.existsSync(source) && !fs.existsSync(join(root, item.target)))
      throw new Error(`reviewed-source-and-target-missing: ${item.source}`);
  }
  for (const [rel, digest] of Object.entries(
    manifest.protectedPostHashes ?? {},
  ))
    if (hash(join(root, rel)) !== digest)
      throw new Error(`protected-post-hash-mismatch: ${rel}`);
  const remnantMap = new Map<string, string>();
  function mapped(path: string): string {
    path = resolve(path);
    if (!isWithinPath(path, root)) return path;
    const rel = relative(root, path);
    if (exact.has(rel)) return join(root, exact.get(rel)!);
    for (const [source, target] of [...remnantMap].sort(
      ([a], [b]) => b.split("/").length - a.split("/").length,
    ))
      if (isWithinPath(path, source)) return join(target, relative(source, path));
    for (const owner of Object.keys(owners).sort(
      (a, b) => b.length - a.length,
    )) {
      const prefix = owner === "." ? "" : owner + "/";
      for (const [old, next] of [
        [".memory/skills", ".harness/skills/managed"],
        [".memory/agent_skills", ".harness/skills/referenced"],
        [".memory", ".harness/memory"],
        [".harness", ".harness"],
      ]) {
        const source = prefix + old;
        if (rel === source || rel.startsWith(source + "/"))
          return join(root, owners[owner]!, next! + rel.slice(source.length));
      }
    }
    for (const [old, next] of Object.entries(DIRECTORIES))
      if (rel === old || rel.startsWith(old + "/"))
        return join(root, next + rel.slice(old.length));
    return path;
  }
  const genericTargets = new Map(
      memory.operations.map((op) => [op.source, mapped(op.target)]),
    ),
    genericDirectories = new Map(
      memory.directoryMap.map((op) => [op.source, mapped(op.target)]),
    );
  for (const [source, dest] of genericTargets)
    if (!exact.has(relative(root, source)))
      exact.set(relative(root, source), relative(root, dest));
  for (const [source, dest] of genericDirectories) remnantMap.set(source, dest);
  const intermediate = new Map(
      memory.operations.map((op) => [op.target, mapped(op.source)]),
    ),
    remapped = (p: string) => intermediate.get(p) ?? mapped(p);
  for (const rel of Object.keys(manifest.protectedPostHashes ?? {})) {
    const path = join(root, rel),
      text = readText(path);
    if (generic.rewriteLinks(text, path, path, mapped) !== text)
      throw new Error(`protected-post-link-needs-human: ${rel}`);
  }
  const operations = new Map<string, generic.MigrationOperation>(),
    sources = new Set<string>();
  function add(
    source: string,
    target: string,
    after: generic.FileState,
    before: generic.FileState | null = generic.state(source),
  ) {
    generic.safeAncestors(source, root);
    generic.safeAncestors(target, root);
    if (source === target && generic.equal(before, after)) return;
    const old = operations.get(target);
    if (old) {
      if (source === old.source) {
        old.after = after;
        return;
      }
      if (
        basename(source) === "AGENTS.md" &&
        basename(target) === "AGENTS.md" &&
        source.split("/").includes(".memory")
      ) {
        if (
          privatePath(source) ||
          memory.private.some(
            (p) => isWithinPath(source, p) || isWithinPath(target, mapped(p)),
          ) ||
          [old.after, after].some(
            (state) =>
              state.kind === "file" &&
              parseTypeMeta(generic.decodeState(state))?.gitignore,
          )
        )
          throw new Error(`private-index-collision: ${relative(root, source)}`);
        let [left, right] = mergeIndexMetadata(
          generic.decodeState(old.after),
          generic.decodeState(after),
        );
        const pattern =
          /<!-- project-memory-entries:start -->([\s\S]*?)<!-- project-memory-entries:end -->/;
        const lines = [
          ...new Set(
            [left, right].flatMap((d) =>
              (d.match(pattern)?.[1] ?? "")
                .split("\n")
                .filter((l) => l.startsWith("- [") && l.includes("](")),
            ),
          ),
        ].sort((a, b) => a.split("](")[1]!.localeCompare(b.split("](")[1]!));
        const entries = `<!-- project-memory-entries:start -->\n${(lines.length ? lines : ["- 暂无条目。"]).join("\n")}\n<!-- project-memory-entries:end -->`;
        left = left.replace(pattern, () => entries);
        right = right.replace(pattern, "");
        old.after = generic.fileState(
          `${left.trimEnd()}\n\n## 原模块：${relative(root, dirname(dirname(dirname(source)))) || "."}\n\n${right.trim()}\n`,
        );
        (old.retire ??= []).push({ source, before });
        sources.add(source);
        return;
      }
      throw new Error(`mapped-target-collision: ${relative(root, target)}`);
    }
    const current = generic.state(target);
    if (source !== target && current && !generic.equal(current, after))
      throw new Error(`target-content-conflict: ${relative(root, target)}`);
    operations.set(target, {
      source,
      target,
      before,
      after,
      originalTarget: current,
    });
    sources.add(source);
  }
  for (const op of [...memory.operations].sort(
    (a, b) =>
      a.source.split("/").length - b.source.split("/").length ||
      a.source.localeCompare(b.source),
  )) {
    const source = op.source,
      dest = mapped(source);
    let after = op.after;
    if (after.kind === "file" && extname(source) === ".md") {
      let text = generic.rewriteLinks(
        generic.decodeState(after),
        op.target,
        dest,
        remapped,
      );
      after = generic.fileState(text, after.mode);
    }
    add(source, dest, after, op.before);
  }
  if (!fullLegacy) {
    const privateSpecs = new Map<string, LegacyType[]>();
    for (const owner of legacy) {
      const old = join(root, owner, ".memory");
      let indexes = false;
      for (const name of fs.readdirSync(old))
        if (
          (isFile(join(old, name)) && name.endsWith(".md")) ||
          isFile(join(old, name, "AGENTS.md"))
        )
          indexes = true;
      const specs = indexes ? generic.parseLegacy(join(root, owner)) : [];
      privateSpecs.set(owner, specs);
      for (const spec of specs) {
        if (!spec.private)
          throw new Error(`unreviewed-public-remnant: ${owner}/${spec.name}`);
        if (
          parseTypeMeta(generic.convertIndex("", spec))!.module !== spec.module
        )
          throw new Error(`private-type-module-conflict: ${spec.name}`);
        memory.private.push(join(root, owner, spec.relativeTarget));
        const dest = join(root, owners[owner]!, spec.relativeTarget);
        remnantMap.set(spec.directory, dest);
        for (const index of spec.indexes)
          exact.set(
            relative(root, index),
            relative(root, join(dest, "AGENTS.md")),
          );
      }
    }
    for (const owner of legacy) {
      const old = join(root, owner, ".memory"),
        specs = privateSpecs.get(owner)!;
      for (const { base, files } of generic.walk(old, false, true)) {
        if (base !== old)
          memory.directoryMap.push({
            source: base,
            target: mapped(base),
            mode: generic.mode(base),
          });
        for (const name of files) {
          const source = join(base, name),
            spec = specs.find(
              (s) => s.indexes.includes(source) || isWithinPath(source, s.directory),
            );
          if (!spec && relative(old, source).split("/")[0] !== "users")
            throw new Error(
              `unreviewed-private-type-or-public-remnant: ${relative(root, source)}`,
            );
          const target = mapped(source);
          if (
            !spec &&
            !isFile(
              join(root, owners[owner]!, ".harness/memory/users/AGENTS.md"),
            )
          )
            throw new Error(
              `private-index-missing: ${owner}/.memory/users/AGENTS.md`,
            );
          let after = generic.state(source)!;
          if (after.kind === "file" && extname(source) === ".md") {
            let text: string | undefined;
            try {
              text = generic.decodeState(after);
            } catch {}
            if (text !== undefined) {
              if (spec?.indexes.includes(source))
                text = generic.convertIndex(text, spec);
              after = generic.fileState(
                generic.rewriteLinks(text, source, target, mapped),
                after.mode,
              );
            }
          } else if (after.kind === "link")
            after = {
              ...after,
              data: relative(
                dirname(target),
                mapped(resolve(dirname(source), after.data)),
              ),
            };
          add(source, target, after);
        }
      }
    }
  }
  const tracked = git(root, "ls-files", "-z").split("\0"),
    candidates = new Set(
      tracked
        .filter(
          (rel) =>
            rel && isFile(join(root, rel)) && !isSymlink(join(root, rel)),
        )
        .map((rel) => join(root, rel)),
    );
  for (const old of Object.keys(DIRECTORIES)) {
    for (const { base, dirs, files } of generic.walk(join(root, old))) {
      for (const n of [".cache", "_site", ".memory", ".harness"]) {
        const i = dirs.indexOf(n);
        if (i >= 0) dirs.splice(i, 1);
      }
      for (const f of files) candidates.add(join(base, f));
    }
  }
  for (const source of [...candidates].sort()) {
    const rel = relative(root, source);
    if (
      sources.has(source) ||
      ["knowledge/posts/", "posts/", ".agents/", ".claude/", ".superpowers/"].some((p) =>
        rel.startsWith(p),
      ) ||
      basename(source) === ".git" ||
      isDirectory(source)
    )
      continue;
    const dest = mapped(source),
      before = generic.state(source)!;
    let after = before;
    if (extname(source) === ".md" && before.kind === "file") {
      let text = generic.rewriteLinks(
        generic.decodeState(before),
        source,
        dest,
        mapped,
      );
      after = generic.fileState(text, before.mode);
    } else if (before.kind === "link")
      after = {
        ...before,
        data: relative(
          dirname(dest),
          mapped(resolve(dirname(source), before.data)),
        ),
      };
    add(source, dest, after, before);
  }
  // Ignored remnants in upgraded clones restore adoption at the original node.
  // This path is opt-in through the explicit instance migration, never public correction.
  if (!fullLegacy)
    for (const directory of memory.private) {
      const destination = mapped(directory);
      const owner = Object.values(owners)
        .filter((value) => isWithinPath(destination, join(root, value, ".harness")))
        .sort((a, b) => b.length - a.length)[0];
      if (owner === undefined)
        throw new Error("private-remnant-owner-unresolved");
      const agents = join(root, owner, "AGENTS.md"),
        existing = operations.get(agents);
      const current = existing?.after ?? generic.state(agents);
      if (!current || current.kind !== "file")
        throw new Error("private-remnant-owner-AGENTS-missing");
      const node = new InternalNode(agents).parse(generic.decodeState(current));
      const target = relative(dirname(agents), join(destination, "AGENTS.md"));
      if (!node.children.some((child) => child.target === target)) {
        node.addChild({
          target,
          label: target,
          kind: "local",
          description: "本节点的私有记忆，仅保存在本克隆。",
        });
        const after = generic.fileState(node.serialize(), current.mode);
        if (existing) existing.after = after;
        else add(agents, agents, after);
      }
    }
  const domainProjects = new Set(
    (manifest.tasks ?? [])
      .filter((i) => i.target.startsWith("tasks/"))
      .map((i) => i.target.split("/")[1]!),
  );
  for (const rel of [
    "AGENTS.md",
    ...[...domainProjects].sort().map((p) => p + "/AGENTS.md"),
  ]) {
    const source = join(root, "knowledge/tasks", rel);
    if (isFile(source)) {
      const dest = join(root, "tasks", rel);
      let text = generic.rewriteLinks(readText(source), source, dest, mapped);
      if (rel === "AGENTS.md") {
        text = stripScope(block(text, "important"));
        text += "\n共同看板约定见[维护看板](../.harness/tasks/AGENTS.md)。\n";
        text = text.replace(
          /^- \[.*?\]\(([^)]+)\/AGENTS.md\).*\n/gm,
          (line, p: string) => (domainProjects.has(p) ? line : ""),
        );
      }
      add(dest, dest, generic.fileState(text));
    }
  }
  function edit(rel: string, transform: (text: string) => string) {
    const target = join(root, rel),
      op = operations.get(target),
      old = op
        ? generic.decodeState(op.after)
        : isFile(target)
          ? readText(target)
          : "",
      value = generic.fileState(transform(old));
    if (op) op.after = value;
    else add(target, target, value);
  }
  if (fullLegacy || fs.existsSync(join(root, "knowledge/tasks"))) {
    edit("AGENTS.md", (text) => {
      text = text.replace(
        "，那是唯一真理源。",
        "；AGENTS.md 组织入口发现，各规范正文按职责保持单一真源。",
      );
      const node = new InternalNode(join(root, "AGENTS.md")).parse(text);
      // ADRs are a Skill-owned collection; its directory is navigation, not an entry file.
      const adrNavigation = node.children.filter(
        (child) =>
          ownershipTarget(root, child.target) === join(root, "docs/adr"),
      );
      for (const child of adrNavigation) node.removeChild(child);
      const links = [
        ["tasks/AGENTS.md", "领域任务", "descendant"],
        [".harness/tasks/AGENTS.md", "根维护任务", "local"],
        [".harness/evaluation/AGENTS.md", "评测", "descendant"],
        [".harness/observation/AGENTS.md", "观测职责与资料", "local"],
        ["teaching/AGENTS.md", "教学与学习状态", "descendant"],
        ["extensions/AGENTS.md", "对外能力实现约束", "descendant"],
        ["shared-extensions/AGENTS.md", "共享扩展约束", "descendant"],
        ["knowledge/notes/AGENTS.md", "笔记规范", "descendant"],
        ["README.md", "目录与内容说明", "local"],
        ["CONTEXT.md", "领域术语", "local"],
      ] as const;
      for (const [target, label, kind] of links) {
        const old = node.children.find((child) => child.target === target);
        if (old) node.updateChild({ ...old, kind });
        else
          node.addChild({ target, label, kind, description: `${label}入口。` });
      }
      const rendered = node.serialize();
      return adrNavigation.length
        ? rendered.replace(
            "<!-- project-memory-local:end -->",
            "\n[架构决策](<docs/adr/>) — 架构决策入口。\n<!-- project-memory-local:end -->",
          )
        : rendered;
    });
    const observation = join(root, "observation/README.md");
    if (fs.existsSync(observation))
      edit(".harness/observation/AGENTS.md", () =>
        generic.rewriteLinks(
          readText(observation),
          observation,
          join(root, ".harness/observation/AGENTS.md"),
          mapped,
        ),
      );
    edit(".gitmodules", (text) =>
      text.replace(
        "path = evaluation/third_party/locomo",
        "path = .harness/evaluation/third_party/locomo",
      ),
    );
  }
  let gitlink: Gitlink | null = null;
  const pin = manifest.gitlink;
  if (pin) {
    if (checkedGitlinkState(root, pin) === "planned") gitlink = pin;
  }
  const directoryTargets = new Map<string, InstanceDirectory>(),
    privateDirs = memory.private.map(mapped);
  for (const item of memory.directoryMap) {
    const source = item.source,
      target = mapped(source);
    generic.safeAncestors(join(target, "placeholder"), root);
    if (generic.present(target) && !isDirectory(target))
      throw new Error(`directory-target-conflict: ${relative(root, target)}`);
    const beforeMode = fs.existsSync(target) ? generic.mode(target) : null,
      priv = privateDirs.some((p) => isWithinPath(target, p)),
      desiredMode = generic.planDirectory(
        source,
        target,
        root,
        priv,
      ).targetMode;
    let record = directoryTargets.get(target);
    if (!record) {
      record = { target, mode: desiredMode, beforeMode, sources: [] };
      directoryTargets.set(target, record);
    }
    record.mode &= desiredMode;
    record.sources.push({ source, mode: item.mode });
  }
  for (const target of privateDirs) {
    if (directoryTargets.has(target)) continue;
    generic.safeAncestors(join(target, "placeholder"), root);
    if (generic.present(target) && !isDirectory(target))
      throw new Error(`directory-target-conflict: ${relative(root, target)}`);
    const beforeMode = fs.existsSync(target) ? generic.mode(target) : null;
    directoryTargets.set(target, {
      target,
      mode: beforeMode === null ? 0o700 : beforeMode & 0o700,
      beforeMode,
      sources: [],
    });
  }
  return {
    directories: [...directoryTargets.values()],
    private: privateDirs,
    watchedSources: [...sources].sort(),
    operations: [...operations.values()],
    diagnostics: memory.diagnostics,
    gitlink,
    legacyOwners: legacy,
    protected: manifest.protectedPostHashes ?? {},
    phase: "planned",
  };
}
export function planMissingPrivateIndexes(root: string, job: InstanceJob) {
  const planned = new Map(job.operations.map((op) => [op.target, op]));
  for (const scope of [
    ...[...new Set(Object.values(OWNER_MAP))].map((owner) => join(root, owner)),
  ]) {
    const agents = join(scope, "AGENTS.md"),
      op = planned.get(agents),
      text = op
        ? generic.decodeState(op.after)
        : isFile(agents)
          ? readText(agents)
          : "",
      local = text.match(
        /<!-- project-memory-local:start -->[\s\S]*?<!-- project-memory-local:end -->/,
      )?.[0];
    if (!local) continue;
    for (const match of local.matchAll(
      /\]\((\.harness\/(memory|skills)\/([^/\s)]+)\/AGENTS\.md)\)/g,
    )) {
      const rel = match[1]!,
        index = join(scope, rel);
      generic.safeAncestors(index, root);
      if (planned.has(index) || isFile(index)) continue;
      if (generic.present(index))
        throw new Error(
          `adopted-index-path-conflict: ${relative(root, index)}`,
        );
      if (rel !== ".harness/memory/users/AGENTS.md")
        throw new Error(
          `missing-adopted-type-index: ${relative(root, index)}; restore original type metadata before migration`,
        );
      const document = isDirectory(dirname(index))
        ? expectedIndexDocument(scope, "user")
        : readIndexTemplate("USER.md", "user", "user");
      const operation: generic.MigrationOperation = {
        source: index,
        target: index,
        before: null,
        after: generic.fileState(document, 0o600),
        originalTarget: null,
      };
      job.operations.push(operation);
      planned.set(index, operation);
      const directory = dirname(index);
      if (!(job.private ??= []).includes(directory))
        job.private.push(directory);
      if (!(job.directories ??= []).some((i) => i.target === directory)) {
        const beforeMode = fs.existsSync(directory)
          ? generic.mode(directory)
          : null;
        job.directories.push({
          target: directory,
          mode: beforeMode === null ? 0o700 : beforeMode & 0o700,
          beforeMode,
          sources: [],
        });
      }
    }
  }
}
/** Accept only reviewed index records, including the add-before-remove interruption. */
function checkedGitlinkState(root: string, pin: Gitlink): "planned" | "moved" {
  for (const path of [pin.source, pin.target])
    generic.safeAncestors(join(root, path), root);
  const entries = git(
    root,
    "ls-files",
    "--stage",
    "-z",
    "--",
    pin.source,
    pin.target,
  )
    .split("\0")
    .filter(Boolean);
  const expected = (path: string) => `160000 ${pin.sha} 0\t${path}`;
  if (pin.source !== pin.target && entries.length === 1) {
    if (entries[0] === expected(pin.source)) return "planned";
    if (entries[0] === expected(pin.target)) return "moved";
  }
  // Uninitialized moves add the target and remove the source in separate Git calls.
  // Replaying the exact pair is idempotent; any different SHA, mode, or stage refuses.
  if (
    pin.source !== pin.target &&
    entries.length === 2 &&
    entries.includes(expected(pin.source)) &&
    entries.includes(expected(pin.target))
  )
    return "planned";
  throw new Error("gitlink-pin-mismatch: saved source or destination changed");
}
export function checkInstanceJob(root: string, job: InstanceJob) {
  if (job.gitlink) checkedGitlinkState(root, job.gitlink);
  for (const op of job.operations) {
    generic.safeAncestors(op.source, root);
    generic.safeAncestors(op.target, root);
    const actual = generic.state(op.target);
    if (![op.originalTarget, op.after].some((v) => generic.equal(actual, v)))
      throw new Error(`resume-target-edited: ${relative(root, op.target)}`);
    for (const item of [op, ...(op.retire ?? [])]) {
      generic.safeAncestors(item.source, root);
      const current = generic.state(item.source),
        allowed =
          item.source !== op.target
            ? [item.before, null]
            : [item.before, op.after];
      if (!allowed.some((v) => generic.equal(current, v)))
        throw new Error(`resume-source-edited: ${relative(root, item.source)}`);
      if (
        item.source !== op.target &&
        current === null &&
        !generic.equal(actual, op.after) &&
        item.before
      )
        throw new Error(`resume-both-missing: ${relative(root, item.source)}`);
    }
  }
  for (const item of job.directories ?? []) {
    generic.safeAncestors(join(item.target, "placeholder"), root);
    if (generic.present(item.target) && !isDirectory(item.target))
      throw new Error(
        `directory-target-conflict: ${relative(root, item.target)}`,
      );
    const actual = fs.existsSync(item.target)
      ? generic.mode(item.target)
      : null;
    if (![item.beforeMode ?? null, item.mode].includes(actual as number))
      throw new Error(
        `resume-directory-mode-changed: ${relative(root, item.target)}`,
      );
    for (const source of item.sources ?? []) {
      generic.safeAncestors(join(source.source, "placeholder"), root);
      if (
        fs.existsSync(source.source) &&
        generic.mode(source.source) !== source.mode
      )
        throw new Error(
          `resume-source-directory-mode-changed: ${relative(root, source.source)}`,
        );
    }
  }
  const watched = new Set(job.watchedSources ?? []);
  for (const owner of job.legacyOwners ?? [])
    for (const { base, files } of generic.walk(
      join(root, owner, ".memory"),
      false,
      true,
    ))
      for (const name of files)
        if (!watched.has(join(base, name)))
          throw new Error(
            `legacy-source-added-after-preflight: ${relative(root, join(base, name))}`,
          );
  for (const [rel, digest] of Object.entries(job.protected))
    if (hash(join(root, rel)) !== digest)
      throw new Error(`protected-post-hash-mismatch: ${rel}`);
}
export function validateInstanceCopies(root: string, job: InstanceJob) {
  const destinations = new Set(job.operations.map((op) => op.target));
  for (const item of job.directories ?? [])
    if (!isDirectory(item.target) || generic.mode(item.target) !== item.mode)
      throw new Error(
        `directory-mode-validation-failed: ${relative(root, item.target)}`,
      );
  for (const op of job.operations) {
    if (!generic.equal(generic.state(op.target), op.after))
      throw new Error(`copy-validation-failed: ${relative(root, op.target)}`);
    if (basename(op.target) === "AGENTS.md" && op.after.kind === "file")
      for (const match of generic
        .decodeState(op.after)
        .matchAll(generic.LINK)) {
        const raw = match[2]!.split("#")[0]!;
        if (!raw || /^\w+:|^\//.test(raw)) continue;
        const linked = resolve(dirname(op.target), decodeURIComponent(raw));
        if (destinations.has(linked) && !generic.present(linked))
          throw new Error(
            `missing-mapped-index-link: ${relative(root, op.target)}`,
          );
      }
  }
  for (const scope of [
    ...[...new Set(Object.values(OWNER_MAP))].map((owner) => join(root, owner)),
  ])
    if (fs.existsSync(join(scope, "AGENTS.md")))
      for (const spec of layerTypeSpecs(scope))
        if (!isFile(join(scope, spec.indexFile)))
          throw new Error(
            `missing-final-type-index: ${relative(root, join(scope, spec.indexFile))}`,
          );
  assertInstanceIgnores(root, job);
}
function assertInstanceIgnores(root: string, job: InstanceJob) {
  const privateDirectories = new Set(job.private ?? []);
  // Older journals can omit private adoption metadata; known private paths stay protected.
  for (const op of job.operations)
    if (privatePath(op.target)) privateDirectories.add(dirname(op.target));
  generic.assertMigrationIgnores(
    root,
    [...privateDirectories],
    job.operations.map((op) => op.target),
    join(root, JOURNAL, "journal.json"),
  );
}
export function runInstanceMigration(
  rawRoot: string,
  manifest: InstanceManifest,
  apply: boolean,
) {
  const root = resolveTarget(rawRoot);
  if (resolveTarget(git(root, "rev-parse", "--show-toplevel")) !== root)
    throw new Error("worktree-must-be-explicit-git-root");
  const journal = join(root, JOURNAL, "journal.json");
  generic.safeAncestors(journal, root);
  if (isSymlink(journal)) throw new Error("unsafe-journal-path");
  const stored = fs.existsSync(journal)
    ? (JSON.parse(readText(journal)) as InstanceJob)
    : undefined;
  if (stored && stored.root !== root) throw new Error("journal-root-mismatch");
  if (stored && stored.phase !== "done") {
    for (const op of stored.operations)
      for (const item of [op, ...(op.retire ?? [])]) {
        const rel = relative(root, item.source);
        for (const [old, owner] of Object.entries(OWNER_MAP)) {
          if (old === "." || owner === ".") continue;
          if (
            [`${old}/.memory/`, `${old}/.harness/`].some((prefix) =>
              rel.startsWith(prefix),
            ) &&
            !isWithinPath(op.target, join(root, owner, ".harness"))
          )
            throw new Error(
              "historical-owner-promotion-journal-needs-review: preserve journal and source/target bytes; do not resume with obsolete ownership",
            );
        }
      }
  }
  const job =
    stored && stored.phase !== "done"
      ? stored
      : makeInstancePlan(root, manifest);
  job.root = root;
  checkInstanceJob(root, job);
  planMissingPrivateIndexes(root, job);
  checkInstanceJob(root, job);
  const publicMap = job.operations
      .filter(
        (op) =>
          !privatePath(op.source) &&
          !privatePath(op.target) &&
          !(job.private ?? []).some(
            (directory) =>
              isWithinPath(op.target, directory) || isWithinPath(op.source, directory),
          ),
      )
      .map((op) => ({
        source: relative(root, op.source),
        target: relative(root, op.target),
      })),
    currentDiagnostics = [
      root,
      join(root, "teaching"),
      join(root, ".harness/evaluation"),
    ].flatMap((scope) =>
      isFile(join(scope, ".harness/skills/referenced/AGENTS.md"))
        ? generic.referencedDiagnostics(scope)
        : [],
    ),
    diagnostics = job.diagnostics.length ? job.diagnostics : currentDiagnostics;
  const result = {
    status: apply ? "unchanged" : "dry-run",
    operations: job.operations.length,
    publicPathMap: publicMap,
    privateOperationCount: job.operations.length - publicMap.length,
    diagnostics,
    complete: !diagnostics.length,
  };
  if (
    !apply ||
    (!job.operations.length && !job.gitlink && !job.directories?.length)
  )
    return result;
  const ignore = join(root, ".gitignore");
  generic.safeAncestors(ignore, root);
  if (generic.present(ignore) && (isSymlink(ignore) || !isFile(ignore)))
    throw new Error("unsafe-gitignore");
  let text = fs.existsSync(ignore) ? readText(ignore) : "";
  const rules = [
    `**/${JOURNAL}/`,
    "**/.harness/memory/users/",
    "**/.memory/users/",
    ...(job.private ?? []).map((p) => "/" + relative(root, p) + "/"),
  ];
  for (const rule of rules)
    if (!text.split(/\r?\n/).includes(rule)) text += "\n" + rule + "\n";
  generic.writeState(
    ignore,
    generic.fileState(
      text,
      fs.existsSync(ignore) ? generic.mode(ignore) : 0o644,
    ),
  );
  assertInstanceIgnores(root, job);
  fs.mkdirSync(dirname(journal), { recursive: true, mode: 0o700 });
  fs.chmodSync(dirname(journal), 0o700);
  generic.saveJournal(journal, job);
  for (const item of [...(job.directories ?? [])].sort(
    (a, b) => a.target.split("/").length - b.target.split("/").length,
  )) {
    generic.safeAncestors(join(item.target, "placeholder"), root);
    fs.mkdirSync(item.target, { recursive: true, mode: item.mode });
    fs.chmodSync(item.target, item.mode);
  }
  for (const op of job.operations)
    if (!generic.equal(generic.state(op.target), op.after))
      generic.writeState(op.target, op.after);
  const pin = job.gitlink;
  if (pin && checkedGitlinkState(root, pin) === "planned") {
    const old = join(root, pin.source),
      next = join(root, pin.target);
    fs.mkdirSync(dirname(next), { recursive: true });
    if (isDirectory(old) && fs.existsSync(join(old, ".git")))
      git(root, "mv", pin.source, pin.target);
    else {
      fs.mkdirSync(next, { recursive: true });
      git(
        root,
        "update-index",
        "--add",
        "--cacheinfo",
        `160000,${pin.sha},${pin.target}`,
      );
      git(root, "update-index", "--force-remove", pin.source);
      if (isDirectory(old)) fs.rmdirSync(old);
    }
  }
  job.phase = "copied";
  generic.saveJournal(journal, job);
  checkInstanceJob(root, job);
  validateInstanceCopies(root, job);
  for (const op of job.operations)
    for (const item of [op, ...(op.retire ?? [])])
      if (item.source !== op.target && generic.present(item.source))
        fs.unlinkSync(item.source);
  for (const rel of [
    ...Object.keys(DIRECTORIES),
    ...job.legacyOwners.map((o) => join(o, ".memory")),
  ]) {
    const old = join(root, rel);
    if (isDirectory(old))
      for (const { base } of [...generic.walk(old)].reverse())
        if (!fs.readdirSync(base).length) fs.rmdirSync(base);
  }
  job.phase = "done";
  generic.saveJournal(journal, job);
  result.status = "migrated";
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { values } = parseArgs({
      options: {
        help: { type: "boolean", short: "h" },
        worktree: { type: "string" },
        manifest: {
          type: "string",
          default:
            "docs/superpowers/plans/2026-10-03-recursive-scope-ownership.json",
        },
        "dry-run": { type: "boolean" },
        apply: { type: "boolean" },
      },
    });
    if (values.help) {
      console.log(
        "Usage: migrate-recursive-layout --worktree PATH [--manifest FILE] (--dry-run | --apply)\n\nReviewed Edges instance migration.\n\n  --worktree PATH  Explicit Git worktree root\n  --manifest FILE  Reviewed ownership manifest\n  --dry-run        Plan without writing\n  --apply          Apply or resume migration\n  -h, --help       Show this help",
      );
    } else {
      if (
        !values.worktree ||
        Boolean(values["dry-run"]) === Boolean(values.apply)
      )
        throw new Error(
          "Required: --worktree PATH and exactly one of --dry-run / --apply",
        );
      const manifest = JSON.parse(
        readText(resolve(values.worktree, values.manifest!)),
      ) as InstanceManifest;
      console.log(
        JSON.stringify(
          runInstanceMigration(
            values.worktree,
            manifest,
            Boolean(values.apply),
          ),
          null,
          2,
        ),
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
