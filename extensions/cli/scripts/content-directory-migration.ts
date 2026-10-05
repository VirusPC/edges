/** One-off public knowledge migration. Attachments remain opaque files, not domain nodes. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fromMarkdown, type Handle } from "mdast-util-from-markdown";
import type { Nodes } from "mdast";
import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

interface Reference {
  start: number;
  end: number;
  href: string;
  decodedHref?: string;
  kind: "markdown" | "wiki" | "html";
  embed?: boolean;
  alias?: boolean;
}
interface Write {
  from: string;
  to: string;
  before: Buffer;
  after: Buffer;
  mode: number;
}
export interface ContentPlan {
  root: string;
  inventory: string[];
  writes: Write[];
  sources: Map<string, { hash: string; mode: number }>;
  mapping: Map<string, string[]>;
  retained: { file: string; reason: string }[];
  unresolved: { file: string; href: string; reason: string }[];
  documentMoves: number;
  assetMoves: number;
}
export interface Options {
  shared?: "retain" | "copy";
  unreferenced?: "retain" | "archive";
}
const contentPath = (f: string) =>
  /^(edges|notes|posts|archive)\//.test(f) && !f.includes("/.harness/");
const privatePath = (f: string) =>
  /(?:^|\/)(?:\.memory|\.harness\/memory)\/(?:users|private)(?:\/|$)/.test(f);
const admin = (f: string) =>
  ["AGENTS.md", "README.md", "SKILL.md"].includes(path.basename(f));
const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const encode = (f: string) =>
  f
    .split("/")
    .map((part) =>
      encodeURIComponent(part).replace(
        /[!'()*]/g,
        (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
      ),
    )
    .join("/");
function safe(root: string, file: string) {
  const absolute = path.resolve(root, file);
  if (!absolute.startsWith(root + path.sep))
    throw new Error(`Outside root: ${file}`);
  for (let at = absolute; at !== root; at = path.dirname(at)) {
    try {
      if (fs.lstatSync(at).isSymbolicLink())
        throw new Error(`Symbolic link: ${file}`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  return absolute;
}
/** Source ranges keep prose, whitespace, YAML and fenced/inline code untouched. */
export function contentReferences(source: string): Reference[] {
  const refs: Reference[] = [];
  const destinations = new WeakMap<Nodes, { start: number; end: number }>();
  const capture: Handle = function (token) {
    const node = this.stack.at(-1);
    if (!node || !["link", "image", "definition"].includes(node.type)) return;
    let start = token.start.offset,
      end = token.end.offset;
    if (source[start] === "<") {
      start++;
      end--;
    }
    destinations.set(node as Nodes, { start, end });
  };
  const tree = fromMarkdown(source, {
    mdastExtensions: [
      {
        enter: { resourceDestination: capture, definitionDestination: capture },
      },
    ],
  });
  // Frontmatter is opaque. In particular quoted [[examples]] in metadata are not links.
  const yamlEnd =
    source.match(/^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)(?:\r?\n|$)/)?.[0]
      .length ?? 0;
  function visit(node: Nodes) {
    const start = node.position?.start.offset ?? 0,
      end = node.position?.end.offset ?? 0;
    if (end <= yamlEnd) return;
    const span = destinations.get(node);
    if (
      span &&
      (node.type === "link" ||
        node.type === "image" ||
        node.type === "definition")
    )
      refs.push({
        ...span,
        href: source.slice(span.start, span.end),
        decodedHref: node.url,
        kind: "markdown",
      });
    if (node.type === "text") {
      for (const m of source
        .slice(start, end)
        .matchAll(/(!?)\[\[([^\]\n]+)\]\]/g)) {
        const offset = start + m.index!;
        if (source[offset - 1] === "\\") continue;
        const raw = m[2]!,
          href = raw.split("|")[0]!;
        refs.push({
          start: offset + m[1]!.length + 2,
          end: offset + m[1]!.length + 2 + href.length,
          href,
          kind: "wiki",
          embed: !!m[1],
          alias: raw.includes("|"),
        });
      }
    }
    if (node.type === "html") {
      const fragment = parseFragment(source.slice(start, end), {
        sourceCodeLocationInfo: true,
      });
      function html(element: DefaultTreeAdapterMap["node"]) {
        if ("attrs" in element)
          for (const attr of element.attrs) {
            if (!["src", "href", "poster"].includes(attr.name)) continue;
            const loc = element.sourceCodeLocation?.attrs?.[attr.name];
            if (!loc) continue;
            const raw = source.slice(
              start + loc.startOffset,
              start + loc.endOffset,
            );
            const prefix = raw.match(/^[^=]+=\s*["']?/);
            if (!prefix) continue;
            const offset = start + loc.startOffset + prefix[0].length;
            const quoted = /["']$/.test(prefix[0]);
            const finish = start + loc.endOffset - (quoted ? 1 : 0);
            refs.push({
              start: offset,
              end: finish,
              href: source.slice(offset, finish),
              decodedHref: attr.value,
              kind: "html",
            });
          }
        if ("childNodes" in element)
          for (const child of element.childNodes) html(child);
        if ("content" in element) html(element.content);
      }
      html(fragment);
    }
    if ("children" in node)
      for (const child of node.children) visit(child as Nodes);
  }
  visit(tree);
  return refs;
}
function hrefParts(ref: Reference) {
  const href = ref.decodedHref ?? ref.href;
  const separator =
    ref.kind === "wiki" ? href.search(/#/) : href.search(/[?#]/);
  return separator < 0
    ? { name: href, suffix: "" }
    : { name: href.slice(0, separator), suffix: href.slice(separator) };
}
function publicFiles(root: string): string[] {
  const listed = [
    ...new Set(
      execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
      )
        .split("\0")
        .filter(Boolean),
    ),
  ];
  const ignored = spawnSync(
    "git",
    ["check-ignore", "--no-index", "-z", "--stdin"],
    {
      cwd: root,
      input: listed.join("\0") + "\0",
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (ignored.status !== 0 && ignored.status !== 1)
    throw new Error(ignored.stderr);
  const ignore = new Set(ignored.stdout.split("\0"));
  return listed
    .filter(
      (f) =>
        !ignore.has(f) &&
        !privatePath(f) &&
        !f.includes("/third_party/") &&
        !f.startsWith(".recursive-layout-migration/") &&
        !f.endsWith("/workspace.json"),
    )
    .filter((f) => {
      const absolute = path.join(root, f);
      if (!fs.existsSync(absolute)) return false;
      if (contentPath(f) || f.startsWith("resources/")) safe(root, f);
      return fs.lstatSync(absolute).isFile();
    })
    .sort();
}
export function planContentUnits(
  input: string,
  options: Options = {},
): ContentPlan {
  const root = fs.realpathSync(path.resolve(input));
  const gitRoot = fs.realpathSync(
    execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
  );
  if (root !== gitRoot) throw new Error("Select the Git repository root");
  const files = publicFiles(root);
  const entries = files.filter(
    (f) => contentPath(f) && f.endsWith(".md") && !admin(f),
  );
  const entrySet = new Set(entries),
    all = new Set(files);
  const plan: ContentPlan = {
    root,
    inventory: files,
    writes: [],
    sources: new Map(),
    mapping: new Map(),
    retained: [],
    unresolved: [],
    documentMoves: 0,
    assetMoves: 0,
  };
  const buffers = new Map<string, Buffer>();
  const read = (f: string) => {
    let b = buffers.get(f);
    if (!b) {
      b = fs.readFileSync(safe(root, f));
      buffers.set(f, b);
    }
    return b;
  };
  for (const f of entries) {
    const to =
      path.basename(f) === "index.md" ? f : f.slice(0, -3) + "/index.md";
    plan.mapping.set(f, [to]);
    if (to !== f) plan.documentMoves++;
  }
  const byName = new Map<string, string[]>();
  for (const f of files)
    for (const name of new Set([
      path.basename(f),
      f.endsWith(".md") ? path.basename(f, ".md") : path.basename(f),
    ]))
      byName.set(name, [...(byName.get(name) ?? []), f]);
  const resolve = (
    file: string,
    ref: Reference,
  ): { target?: string; reason?: string } => {
    const parts = hrefParts(ref);
    if (!parts.name || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(parts.name))
      return {};
    let name: string;
    try {
      name = decodeURIComponent(parts.name);
    } catch {
      return { reason: "invalid URI encoding" };
    }
    if (ref.kind !== "wiki")
      return {
        target: path.relative(
          root,
          path.resolve(root, path.dirname(file), name),
        ),
      };
    const local = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), name),
    );
    const direct = [name, name + ".md", local, local + ".md"].filter((x) =>
      all.has(x),
    );
    if (direct.length) return { target: direct[0] };
    const matches = name.includes("/")
      ? files.filter(
          (f) => f.endsWith("/" + name) || f.endsWith("/" + name + ".md"),
        )
      : (byName.get(name) ?? []);
    return matches.length === 1
      ? { target: matches[0] }
      : {
          reason: matches.length
            ? "ambiguous wiki target"
            : "missing wiki target",
        };
  };
  const parsed = new Map<string, { ref: Reference; target?: string }[]>();
  const assets = files.filter(
    (f) =>
      (contentPath(f) || f.startsWith("resources/")) &&
      !f.endsWith(".md") &&
      !f.endsWith(".gitkeep"),
  );
  const assetSet = new Set(assets),
    owners = new Map(assets.map((f) => [f, new Set<string>()]));
  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const refs = contentReferences(read(file).toString("utf8")).map((ref) => {
      const resolved = resolve(file, ref);
      if (resolved.reason && entrySet.has(file))
        plan.unresolved.push({ file, href: ref.href, reason: resolved.reason });
      if (
        resolved.target &&
        entrySet.has(file) &&
        !all.has(resolved.target) &&
        !fs.existsSync(path.resolve(root, resolved.target))
      )
        plan.unresolved.push({
          file,
          href: ref.href,
          reason: "missing local target",
        });
      if (resolved.target && assetSet.has(resolved.target))
        owners.get(resolved.target)!.add(file);
      return { ref, target: resolved.target };
    });
    parsed.set(file, refs);
  }
  const ambiguous = plan.unresolved.find(
    (x) => x.reason === "ambiguous wiki target",
  );
  if (ambiguous)
    throw new Error(
      `Ambiguous wiki target in ${ambiguous.file}: ${ambiguous.href}; use an explicit path before migration`,
    );
  // Per-reader routing avoids ambiguous bare-name wiki embeds after shared assets are copied.
  const ownedDestination = new Map<string, string>();
  const targets = new Map<string, string>();
  for (const [from, [to]] of plan.mapping)
    if (from !== to) {
      if (all.has(to!)) throw new Error(`Destination collision: ${to}`);
      targets.set(to!, from);
    }
  const claim = (from: string, to: string) => {
    safe(root, to);
    if (
      (fs.existsSync(path.join(root, to)) && to !== from) ||
      (targets.has(to) && targets.get(to) !== from)
    )
      throw new Error(`Destination collision: ${to}`);
    targets.set(to, from);
    return to;
  };
  for (const asset of assets) {
    const readers = [...owners.get(asset)!],
      owned = readers.filter((f) => entrySet.has(f));
    if (!owned.length) {
      // Only the former root attachment pool is retired automatically; other opaque resources stay put.
      if (
        !readers.length &&
        asset.startsWith("resources/") &&
        options.unreferenced === "archive"
      )
        plan.mapping.set(asset, [
          claim(asset, "archive/unassigned-resources/" + asset),
        ]);
      else if (asset.startsWith("resources/") || !readers.length)
        plan.retained.push({
          file: asset,
          reason: readers.length
            ? "referenced outside content entries"
            : "no resolved reference",
        });
      continue;
    }
    if (owned.length > 1 && options.shared !== "copy") {
      plan.retained.push({ file: asset, reason: "shared by multiple entries" });
      continue;
    }
    const destinations: string[] = [];
    for (const owner of owned) {
      const newDir = path.posix.dirname(plan.mapping.get(owner)![0]!);
      const oldDir = path.posix.dirname(owner);
      const local = path.posix.relative(oldDir, asset);
      const suffix = local.startsWith("../")
        ? path.posix.basename(asset)
        : local;
      const to = claim(asset, path.posix.join(newDir, suffix));
      destinations.push(to);
      ownedDestination.set(owner + "\0" + asset, to);
    }
    plan.mapping.set(asset, [...new Set(destinations)]);
  }
  const destination = (file: string, target: string) =>
    ownedDestination.get(file + "\0" + target) ??
    plan.mapping.get(target)?.[0] ??
    target;
  for (const [file, refs] of parsed) {
    const before = read(file),
      source = before.toString("utf8");
    const to = plan.mapping.get(file)?.[0] ?? file;
    const changes: { start: number; end: number; value: string }[] = [];
    for (const { ref, target } of refs) {
      if (!target) continue;
      const next = destination(file, target),
        { suffix } = hrefParts(ref);
      if (next === target && to === file) continue;
      let value: string;
      if (ref.kind === "wiki") {
        // Root-relative wiki paths are stable; preserve displayed text of former bare links.
        if (next === target && !ref.href.startsWith(".")) continue;
        value = next + suffix;
        if (!ref.embed && !ref.alias) value += "|" + ref.href;
      } else {
        const oldRelative = path.posix.relative(
          path.posix.dirname(file),
          target,
        );
        const newRelative = path.posix.relative(path.posix.dirname(to), next);
        if (oldRelative === newRelative) continue;
        value = encode(newRelative || ".") + suffix;
      }
      if (ref.kind === "html")
        value = value.replace(
          /[&<>"'`=\s]/g,
          (c) => "&#" + c.charCodeAt(0) + ";",
        );
      if (ref.kind === "markdown")
        value = value
          .replace(/&/g, "&amp;")
          .replace(
            /[\\()<>"'\s]/g,
            (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
          );
      changes.push({ start: ref.start, end: ref.end, value });
    }
    let after = source;
    for (const edit of changes.sort((a, b) => b.start - a.start))
      after = after.slice(0, edit.start) + edit.value + after.slice(edit.end);
    if (to !== file || after !== source)
      plan.writes.push({
        from: file,
        to,
        before,
        after: Buffer.from(after),
        mode: fs.statSync(path.join(root, file)).mode,
      });
  }
  for (const asset of assets) {
    const destinations = plan.mapping.get(asset);
    if (!destinations) continue;
    const before = read(asset),
      mode = fs.statSync(path.join(root, asset)).mode;
    for (const to of destinations)
      if (to !== asset) {
        plan.writes.push({ from: asset, to, before, after: before, mode });
        plan.assetMoves++;
      }
  }
  // Snapshot all read Markdown and source bytes: reference changes invalidate ownership decisions too.
  for (const [file, b] of buffers)
    plan.sources.set(file, {
      hash: digest(b),
      mode: fs.statSync(path.join(root, file)).mode,
    });
  // Detect path-prefix conflicts and untracked destinations as well as tracked collisions.
  for (const write of plan.writes) {
    safe(root, write.to);
    if (write.from !== write.to && fs.existsSync(path.join(root, write.to)))
      throw new Error(`Destination collision: ${write.to}`);
    for (let dir = path.dirname(write.to); dir !== "."; dir = path.dirname(dir))
      if (
        fs.existsSync(path.join(root, dir)) &&
        !fs.statSync(path.join(root, dir)).isDirectory()
      )
        throw new Error(`Destination directory collision: ${dir}`);
  }
  if (plan.writes.length) {
    const ignoredTargets = spawnSync(
      "git",
      ["check-ignore", "--no-index", "-z", "--stdin"],
      {
        cwd: root,
        input: plan.writes.map((w) => w.to).join("\0") + "\0",
        encoding: "utf8",
      },
    );
    if (ignoredTargets.status === 0)
      throw new Error(
        `Ignored migration destination: ${ignoredTargets.stdout.split("\0").filter(Boolean).join(", ")}`,
      );
    if (ignoredTargets.status !== 1) throw new Error(ignoredTargets.stderr);
  }
  return plan;
}
export function applyContentUnits(plan: ContentPlan): void {
  const { root } = plan;
  if (JSON.stringify(publicFiles(root)) !== JSON.stringify(plan.inventory))
    throw new Error("File inventory changed since preview; rebuild the plan");
  for (const [file, snapshot] of plan.sources) {
    const absolute = safe(root, file);
    if (
      !fs.existsSync(absolute) ||
      digest(fs.readFileSync(absolute)) !== snapshot.hash ||
      fs.statSync(absolute).mode !== snapshot.mode
    )
      throw new Error(`Source changed since preview: ${file}`);
  }
  for (const w of plan.writes)
    if (w.from !== w.to && fs.existsSync(safe(root, w.to)))
      throw new Error(`Destination collision: ${w.to}`);
  const createdDirs: string[] = [],
    written: Write[] = [],
    removed: string[] = [];
  function mkdir(dir: string) {
    if (fs.existsSync(dir)) return;
    mkdir(path.dirname(dir));
    fs.mkdirSync(dir);
    createdDirs.push(dir);
  }
  try {
    for (const w of plan.writes) {
      const absolute = safe(root, w.to);
      mkdir(path.dirname(absolute));
      // Register only after opening: a failed exclusive open must never delete a racing file.
      const fd = fs.openSync(absolute, w.from === w.to ? "w" : "wx", w.mode);
      written.push(w);
      try {
        fs.writeFileSync(fd, w.after);
        fs.fchmodSync(fd, w.mode);
      } finally {
        fs.closeSync(fd);
      }
    }
    for (const from of new Set(
      plan.writes.filter((w) => w.from !== w.to).map((w) => w.from),
    )) {
      if (plan.mapping.get(from)?.includes(from)) continue;
      fs.unlinkSync(path.join(root, from));
      removed.push(from);
    }
  } catch (error) {
    for (const from of removed) {
      const w = plan.writes.find((w) => w.from === from)!;
      fs.writeFileSync(path.join(root, from), w.before, { mode: w.mode });
    }
    for (const w of written.reverse())
      if (w.from === w.to) fs.writeFileSync(path.join(root, w.from), w.before);
      else if (fs.existsSync(path.join(root, w.to)))
        fs.unlinkSync(path.join(root, w.to));
    for (const dir of createdDirs.reverse())
      if (fs.existsSync(dir) && !fs.readdirSync(dir).length) fs.rmdirSync(dir);
    throw error;
  }
  // Empty directories only; never recursive-delete untracked attachments or local maintenance files.
  for (const from of removed) {
    for (
      let dir = path.dirname(path.join(root, from));
      dir !== root;
      dir = path.dirname(dir)
    ) {
      if (!fs.existsSync(dir)) continue;
      if (fs.readdirSync(dir).length) break;
      fs.rmdirSync(dir);
    }
  }
}
