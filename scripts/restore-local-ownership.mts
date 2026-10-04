#!/usr/bin/env -S node --import tsx
/** Reviewed instance correction. Public and private entry points never share discovery. */
import * as fs from "node:fs";
import { dirname, join, relative, resolve, isAbsolute } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { InternalNode } from "../extensions/cli/src/models/internal-node.js";
import { parseTypeMeta } from "../extensions/cli/src/services/memory/types.js";
import { OWNER_MAP, type InstanceJob } from "./migrate-recursive-layout.mjs";
import * as migration from "../extensions/cli/src/services/memory/migrate.js";
import {
  within,
  isDirectory,
  isSymlink,
} from "../extensions/cli/src/services/memory/paths.js";
export interface CorrectionManifest {
  version: 1;
  moves: {
    source: string;
    target: string;
    sha256: string;
    after: string;
    afterSha256: string;
    mode?: number;
  }[];
  edits: {
    path: string;
    beforeSha256: string | null;
    after: string;
    mode?: number;
  }[];
  units: { source: string; target: string; files: string[]; mode?: number }[];
}
const JOURNAL = ".ownership-correction/public.json";
const hash = (text: string) => migration.sha(Buffer.from(text));
const stateHash = (state: migration.FileState | null) =>
  state?.kind === "file"
    ? migration.sha(Buffer.from(state.data, "base64"))
    : null;
const git = (root: string, ...args: string[]) =>
  execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
function checkedRoot(raw: string) {
  const root = fs.realpathSync(raw);
  if (fs.realpathSync(git(root, "rev-parse", "--show-toplevel")) !== root)
    throw Error("explicit-git-root-required");
  return root;
}
function safePath(root: string, rel: string) {
  if (
    !rel ||
    isAbsolute(rel) ||
    rel.split("/").some((p) => p === ".." || p === ".") ||
    rel.includes("\\")
  )
    throw Error(`unsafe-path: ${rel}`);
  if (
    rel === ".git" ||
    rel.startsWith(".git/") ||
    rel.startsWith("knowledge/posts/") ||
    rel === ".obsidian/workspace.json"
  )
    throw Error(`protected-path: ${rel}`);
  const path = resolve(root, rel);
  if (!within(path, root) || path === root) throw Error(`unsafe-path: ${rel}`);
  migration.safeAncestors(path, root);
  if (isSymlink(path)) throw Error(`unsafe-path-symlink: ${rel}`);
  return path;
}
function inventoryUnit(root: string, rel: string): string[] {
  const path = safePath(root, rel);
  if (!migration.present(path)) return [];
  if (!isDirectory(path)) throw Error(`unit-not-directory: ${rel}`);
  const found: string[] = [];
  function scan(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const item = join(dir, entry.name);
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile()))
        throw Error(`unit-unsafe-resource: ${rel}`);
      if (entry.isDirectory()) scan(item);
      else found.push(relative(path, item));
    }
  }
  scan(path);
  return found.sort();
}
function assertUnits(root: string, manifest: CorrectionManifest) {
  for (const unit of manifest.units) {
    const allowed = [...unit.files].sort();
    for (const rel of [unit.source, unit.target]) {
      const path = safePath(root, rel);
      if (
        migration.present(path) &&
        unit.mode !== undefined &&
        migration.mode(path) !== unit.mode
      )
        throw Error(`unit-mode-conflict: ${rel}`);
    }
    const source = inventoryUnit(root, unit.source),
      target = inventoryUnit(root, unit.target);
    if (
      source.some((p) => !allowed.includes(p)) ||
      target.some((p) => !allowed.includes(p)) ||
      allowed.some((p) => !source.includes(p) && !target.includes(p))
    )
      throw Error(`unit-resource-conflict: ${unit.source}`);
    for (const file of allowed)
      if (
        !manifest.moves.some(
          (m) =>
            m.source === `${unit.source}/${file}` &&
            m.target === `${unit.target}/${file}`,
        )
      )
        throw Error(`unit-mapping-missing: ${unit.source}`);
  }
}
export function runPublicCorrection(
  rawRoot: string,
  manifest: CorrectionManifest,
  apply: boolean,
) {
  const root = checkedRoot(rawRoot);
  if (manifest.version !== 1) throw Error("unsupported-correction-manifest");
  assertUnits(root, manifest);
  const operations: migration.MigrationOperation[] = [];
  const paths = new Set<string>();
  const reserve = (rel: string) => {
    if (paths.has(rel)) throw Error(`duplicate-correction-path: ${rel}`);
    paths.add(rel);
    return safePath(root, rel);
  };
  for (const move of manifest.moves) {
    const source = reserve(move.source),
      target = reserve(move.target);
    // Public correction may never be used as an implicit private migration.
    if ([move.source, move.target].some((p) => /\/(users|\.memory)\//.test(p)))
      throw Error("public-private-path-refused");
    const before = migration.state(source),
      current = migration.state(target);
    const mode = move.mode ?? before?.mode ?? current?.mode ?? 0o644;
    const after = migration.fileState(move.after, mode);
    if (hash(move.after) !== move.afterSha256)
      throw Error(`manifest-output-hash-mismatch: ${move.target}`);
    if (
      before &&
      (before.kind !== "file" ||
        stateHash(before) !== move.sha256 ||
        before.mode !== mode)
    )
      throw Error(`source-hash-mismatch: ${move.source}`);
    if (current && !migration.equal(current, after))
      throw Error(`target-conflict: ${move.target}`);
    if (!before && !current)
      throw Error(`source-and-target-missing: ${move.source}`);
    if (before)
      operations.push({
        source,
        target,
        before,
        after,
        originalTarget: current,
      });
  }
  for (const edit of manifest.edits) {
    const path = reserve(edit.path),
      before = migration.state(path);
    const after = migration.fileState(
      edit.after,
      edit.mode ?? before?.mode ?? 0o644,
    );
    if (migration.equal(before, after)) continue;
    if (before?.kind === "link" || stateHash(before) !== edit.beforeSha256)
      throw Error(`index-or-link-conflict: ${edit.path}`);
    operations.push({
      source: path,
      target: path,
      before,
      after,
      originalTarget: before,
    });
  }
  const journal = safePath(root, JOURNAL),
    identity = hash(JSON.stringify(manifest));
  let saved:
    | {
        root: string;
        identity: string;
        operations: migration.MigrationOperation[];
      }
    | undefined;
  if (migration.present(journal)) {
    saved = JSON.parse(fs.readFileSync(journal, "utf8"));
    if (saved?.root !== root || saved.identity !== identity)
      throw Error("correction-journal-mismatch");
  }
  const result = {
    status: !apply ? "dry-run" : operations.length ? "restored" : "unchanged",
    operations: operations.length,
    moves: manifest.moves.length,
  };
  if (!apply || !operations.length) return result;
  const ignore = safePath(root, ".gitignore");
  const ignoreBefore = migration.state(ignore);
  if (ignoreBefore && ignoreBefore.kind !== "file")
    throw Error("unsafe-gitignore");
  let ignoreText = ignoreBefore ? migration.decodeState(ignoreBefore) : "";
  const rule = "**/.ownership-correction/";
  if (!ignoreText.split(/\r?\n/).includes(rule)) ignoreText += `\n${rule}\n`;
  // An existing lower-level negation must refuse before a journal contains snapshots.
  if (isDirectory(dirname(journal))) {
    const nested = join(dirname(journal), ".gitignore");
    if (migration.present(nested))
      throw Error("correction-journal-ignore-needs-review");
  }
  migration.writeState(
    ignore,
    migration.fileState(ignoreText, ignoreBefore?.mode ?? 0o644),
  );
  try {
    migration.assertMigrationIgnores(root, [], [], journal);
  } catch (error) {
    if (ignoreBefore) migration.writeState(ignore, ignoreBefore);
    else fs.unlinkSync(ignore);
    throw error;
  }
  fs.mkdirSync(dirname(journal), { recursive: true, mode: 0o700 });
  fs.chmodSync(dirname(journal), 0o700);
  migration.saveJournal(journal, saved ?? { root, identity, operations });
  for (const unit of manifest.units) {
    const target = safePath(root, unit.target);
    fs.mkdirSync(target, { recursive: true, mode: unit.mode ?? 0o755 });
    if (unit.mode !== undefined) fs.chmodSync(target, unit.mode);
  }
  for (const op of operations) {
    migration.safeAncestors(op.target, root);
    if (!migration.equal(migration.state(op.target), op.originalTarget))
      throw Error(`concurrent-target-conflict: ${relative(root, op.target)}`);
    if (!migration.equal(migration.state(op.source), op.before))
      throw Error(`concurrent-source-conflict: ${relative(root, op.source)}`);
    migration.writeState(op.target, op.after);
  }
  for (const op of operations)
    if (!migration.equal(migration.state(op.target), op.after))
      throw Error("correction-copy-validation-failed");
  for (const op of operations)
    if (op.source !== op.target) {
      if (!migration.equal(migration.state(op.source), op.before))
        throw Error("concurrent-source-conflict-before-retire");
      fs.unlinkSync(op.source);
    }
  for (const unit of manifest.units) {
    const source = safePath(root, unit.source);
    if (isDirectory(source))
      for (const { base } of [...migration.walk(source)].reverse())
        if (!fs.readdirSync(base).length) fs.rmdirSync(base);
  }
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { values } = parseArgs({
      options: {
        root: { type: "string" },
        manifest: { type: "string" },
        apply: { type: "boolean" },
        "dry-run": { type: "boolean" },
        private: { type: "boolean" },
      },
    });
    if (
      !values.root ||
      (!values.manifest && !values.private) ||
      (values.manifest && values.private) ||
      (values.apply && values["dry-run"])
    )
      throw Error(
        "usage: --root <clone> (--manifest <reviewed.json> | --private) [--dry-run|--apply]",
      );
    const result = values.private
      ? runPrivateCorrection(values.root, Boolean(values.apply))
      : runPublicCorrection(
          values.root,
          JSON.parse(
            fs.readFileSync(resolve(values.manifest!), "utf8"),
          ) as CorrectionManifest,
          Boolean(values.apply),
        );
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "needs-review") process.exitCode = 2;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

interface PrivateCorrectionJob {
  root: string;
  provenanceSha256: string;
  operations: migration.MigrationOperation[];
  privateDirectories: string[];
  sourceDirectories: string[];
}
/** Explicit per-clone opt-in. No ownership inference from private titles or record bodies. */
export function runPrivateCorrection(rawRoot: string, apply: boolean) {
  const root = checkedRoot(rawRoot);
  const unresolved: { path: string; reason: string }[] = [];
  const review = (path: string, reason: string) => {
    unresolved.push({ path, reason });
    return { status: "needs-review", operations: 0, unresolved };
  };
  const journal = safePath(root, ".recursive-layout-migration/journal.json");
  const recovery = safePath(root, ".ownership-correction/private.json");
  if (!migration.present(journal))
    return review(
      ".harness",
      "missing-local-journal: ownership of promoted private content is unresolved",
    );
  if (
    migration.mode(journal) & 0o077 ||
    migration.mode(dirname(journal)) & 0o077
  )
    return review(
      relative(root, journal),
      "unsafe-private-journal-permissions",
    );
  let old: InstanceJob;
  const provenanceBytes = fs.readFileSync(journal);
  try {
    old = JSON.parse(provenanceBytes.toString("utf8"));
  } catch {
    return review(relative(root, journal), "invalid-local-journal");
  }
  if (
    old.root !== root ||
    old.phase !== "done" ||
    !Array.isArray(old.operations) ||
    !Array.isArray(old.private) ||
    !Array.isArray(old.directories)
  )
    return review(
      relative(root, journal),
      "journal-root-phase-or-shape-unverified",
    );
  let job: PrivateCorrectionJob;
  if (migration.present(recovery)) {
    if (
      migration.mode(recovery) & 0o077 ||
      migration.mode(dirname(recovery)) & 0o077
    )
      return review(
        relative(root, recovery),
        "unsafe-private-journal-permissions",
      );
    try {
      job = JSON.parse(fs.readFileSync(recovery, "utf8"));
    } catch {
      return review(
        relative(root, recovery),
        "invalid-private-correction-journal",
      );
    }
    if (
      job.root !== root ||
      job.provenanceSha256 !== migration.sha(provenanceBytes)
    )
      return review(
        relative(root, recovery),
        "private-correction-provenance-mismatch",
      );
  } else {
    const candidates: {
      source: string;
      target: string;
      owner: string;
      operations: migration.MigrationOperation[];
    }[] = [];
    for (const directory of old.private) {
      if (
        typeof directory !== "string" ||
        !isAbsolute(directory) ||
        !within(directory, root)
      )
        return review(".harness", "private-directory-outside-clone");
      const rel = relative(root, directory);
      if (!/^\.harness\/(memory|skills)\/[^/]+$/.test(rel)) continue;
      safePath(root, rel);
      const ops = old.operations.filter((op) => within(op.target, directory));
      const promoted = ops.filter((op) =>
        Object.keys(OWNER_MAP).some(
          (owner) =>
            owner !== "." &&
            owner !== "evaluation" &&
            owner !== "knowledge/teaching" &&
            op.source.startsWith(join(root, owner, ".memory") + "/"),
        ),
      );
      if (!promoted.length) continue;
      const owners = [
        ...new Set(
          promoted.map(
            (op) =>
              Object.keys(OWNER_MAP)
                .filter(
                  (owner) =>
                    owner !== "." &&
                    op.source.startsWith(join(root, owner, ".memory") + "/"),
                )
                .sort((a, b) => b.length - a.length)[0]!,
          ),
        ),
      ];
      if (
        owners.length !== 1 ||
        promoted.length !== ops.length ||
        ops.some((op) => op.retire?.length || op.originalTarget || !op.before)
      )
        return review(rel, "ambiguous-or-merged-private-provenance");
      const owner = owners[0]!;
      // The recorded directory map, not a filename/title, proves the original type directory.
      const recorded = old.directories.filter(
        (d) =>
          d.target === directory &&
          d.sources?.length === 1 &&
          d.sources[0]!.source.startsWith(join(root, owner, ".memory") + "/"),
      );
      if (recorded.length !== 1)
        return review(rel, "missing-or-ambiguous-private-directory-provenance");
      const sourceDir = recorded[0]!.sources[0]!.source;
      if (dirname(sourceDir) !== join(root, owner, ".memory"))
        return review(rel, "nested-private-type-provenance-needs-review");
      const index = ops.find(
        (op) => op.target === join(directory, "AGENTS.md"),
      );
      if (
        !index?.before ||
        index.before.kind !== "file" ||
        index.after.kind !== "file" ||
        index.source !== join(sourceDir, "AGENTS.md")
      )
        return review(rel, "missing-original-private-index-provenance");
      let meta;
      try {
        meta = parseTypeMeta(migration.decodeState(index.after));
      } catch {
        return review(rel, "invalid-private-type-metadata");
      }
      if (
        !meta?.gitignore ||
        meta.module !==
          relative(join(root, ".harness"), directory).split("/")[0]
      )
        return review(rel, "private-type-module-or-permission-mismatch");
      const oldMeta = parseTypeMeta(migration.decodeState(index.before));
      if (
        oldMeta &&
        (oldMeta.name !== meta.name ||
          oldMeta.module !== meta.module ||
          oldMeta.gitignore !== meta.gitignore ||
          oldMeta.writable !== meta.writable ||
          oldMeta.format !== meta.format)
      )
        return review(rel, "private-original-type-identity-mismatch");
      if (!oldMeta && !(meta.name === "user" && sourceDir.endsWith("/users")))
        return review(rel, "custom-private-original-metadata-missing");
      const expected = ops.map((op) => relative(directory, op.target)).sort();
      if (
        new Set(ops.map((op) => op.source)).size !== ops.length ||
        new Set(ops.map((op) => op.target)).size !== ops.length ||
        !migration.equal(inventoryUnit(root, rel), expected)
      )
        return review(rel, "private-assets-added-missing-or-ambiguous");
      for (const op of ops) {
        safePath(root, relative(root, op.source));
        safePath(root, relative(root, op.target));
        if (
          !within(op.source, sourceDir) ||
          relative(sourceDir, op.source) !== relative(directory, op.target) ||
          old.operations.filter(
            (other) => other.source === op.source || other.target === op.target,
          ).length !== 1 ||
          !migration.equal(migration.state(op.target), op.after) ||
          migration.present(op.source)
        )
          return review(
            relative(root, op.target),
            "private-source-identity-changed-or-ambiguous",
          );
        if (op.after.kind !== "file")
          return review(
            relative(root, op.target),
            "private-link-provenance-needs-review",
          );
      }
      const target = join(root, OWNER_MAP[owner]!, rel);
      if (migration.present(target))
        return review(relative(root, target), "private-target-occupied");
      candidates.push({ source: directory, target, owner, operations: ops });
    }
    if (!candidates.length)
      return review(
        ".harness",
        "no-uniquely-proven-promoted-private-types; ownership remains unresolved",
      );
    const mapping = (path: string) => {
      const candidate = candidates.find((c) => within(path, c.source));
      return candidate
        ? join(candidate.target, relative(candidate.source, path))
        : path;
    };
    const operations: migration.MigrationOperation[] = [];
    const edits = new Map<string, InternalNode>();
    const node = (path: string) => {
      safePath(root, relative(root, path));
      if (!edits.has(path)) {
        const value = migration.state(path);
        if (!value || value.kind !== "file")
          throw Error("private-owner-AGENTS-missing");
        edits.set(
          path,
          new InternalNode(path).parse(migration.decodeState(value)),
        );
      }
      return edits.get(path)!;
    };
    for (const candidate of candidates) {
      for (const op of candidate.operations) {
        const after = migration.fileState(
          migration.rewriteLinks(
            migration.decodeState(op.after),
            op.target,
            mapping(op.target),
            mapping,
          ),
          op.after.mode & 0o600,
        );
        operations.push({
          source: op.target,
          target: mapping(op.target),
          before: op.after,
          after,
          originalTarget: null,
        });
      }
      const ownerPath = join(root, OWNER_MAP[candidate.owner]!, "AGENTS.md"),
        indexPath = join(candidate.target, "AGENTS.md");
      const local = node(ownerPath),
        target = relative(dirname(ownerPath), indexPath);
      if (!local.children.some((child) => child.target === target))
        local.addChild({
          target,
          kind: "local",
          label: target,
          description: "本节点的私有记忆，仅保存在本克隆。",
        });
      const parent = node(join(root, "AGENTS.md"));
      for (const child of parent.children)
        if (resolve(root, child.target) === join(candidate.source, "AGENTS.md"))
          parent.removeChild(child);
    }
    for (const [path, doc] of edits) {
      const before = migration.state(path)!;
      const after = migration.fileState(doc.serialize(), before.mode);
      if (!migration.equal(before, after))
        operations.push({
          source: path,
          target: path,
          before,
          after,
          originalTarget: before,
        });
    }
    job = {
      root,
      provenanceSha256: migration.sha(provenanceBytes),
      operations,
      privateDirectories: candidates.map((c) => c.target),
      sourceDirectories: candidates.map((c) => c.source),
    };
  }
  // Resource membership must remain unchanged even when resuming copied data.
  for (const directory of [
    ...job.sourceDirectories,
    ...job.privateDirectories,
  ]) {
    safePath(root, relative(root, directory));
    const expected = job.operations
      .filter((op) => op.source !== op.target)
      .flatMap((op) =>
        [op.source, op.target]
          .filter((path) => within(path, directory))
          .map((path) => relative(directory, path)),
      );
    if (
      inventoryUnit(root, relative(root, directory)).some(
        (path) => !expected.includes(path),
      )
    )
      return review(
        relative(root, directory),
        "private-correction-unrecorded-resource",
      );
  }
  // Validate both initial and resumable states before modifying ignores, modes, or content.
  for (const op of job.operations) {
    safePath(root, relative(root, op.source));
    safePath(root, relative(root, op.target));
    const source = migration.state(op.source),
      target = migration.state(op.target);
    if (![op.originalTarget, op.after].some((s) => migration.equal(s, target)))
      return review(
        relative(root, op.target),
        "private-correction-target-conflict",
      );
    const allowed =
      op.source === op.target ? [op.before, op.after] : [op.before, null];
    if (
      !allowed.some((s) => migration.equal(s, source)) ||
      (!source && !migration.equal(target, op.after))
    )
      return review(
        relative(root, op.source),
        "private-correction-source-conflict",
      );
  }
  const pending = job.operations.some(
    (op) =>
      !migration.equal(migration.state(op.target), op.after) ||
      (op.source !== op.target && migration.present(op.source)),
  );
  if (!pending) return { status: "unchanged", operations: 0, unresolved };
  // Private destinations AND the provenance/recovery journal must already be ignored.
  // We deliberately do not weaken or silently rewrite per-clone ignore policy.
  migration.assertMigrationIgnores(
    root,
    [...job.privateDirectories, ...job.sourceDirectories],
    job.operations
      .filter((op) => op.source !== op.target)
      .flatMap((op) => [op.source, op.target]),
    recovery,
  );
  git(root, "check-ignore", "-q", "--no-index", journal);
  if (!apply)
    return { status: "dry-run", operations: job.operations.length, unresolved };
  for (const directory of job.privateDirectories) {
    safePath(root, relative(root, directory));
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    fs.chmodSync(directory, 0o700);
  }
  fs.mkdirSync(dirname(recovery), { recursive: true, mode: 0o700 });
  fs.chmodSync(dirname(recovery), 0o700);
  migration.saveJournal(recovery, job);
  for (const op of job.operations)
    if (!migration.equal(migration.state(op.target), op.after)) {
      // All resource subdirectories receive restrictive modes before copying bytes.
      if (op.source !== op.target) {
        fs.mkdirSync(dirname(op.target), { recursive: true, mode: 0o700 });
        for (
          let dir = dirname(op.target);
          job.privateDirectories.some((p) => within(dir, p));
          dir = dirname(dir)
        )
          fs.chmodSync(dir, 0o700);
      }
      if (
        !migration.equal(migration.state(op.target), op.originalTarget) ||
        !migration.equal(migration.state(op.source), op.before)
      )
        throw Error("private-correction-concurrent-edit");
      migration.writeState(op.target, op.after);
    }
  for (const op of job.operations)
    if (!migration.equal(migration.state(op.target), op.after))
      throw Error("private-correction-copy-validation-failed");
  for (const op of job.operations)
    if (op.source !== op.target && migration.present(op.source)) {
      if (!migration.equal(migration.state(op.source), op.before))
        throw Error("private-correction-source-changed-before-retire");
      fs.unlinkSync(op.source);
    }
  for (const directory of job.sourceDirectories)
    for (const { base } of [...migration.walk(directory)].reverse())
      if (!fs.readdirSync(base).length) fs.rmdirSync(base);
  return { status: "restored", operations: job.operations.length, unresolved };
}
