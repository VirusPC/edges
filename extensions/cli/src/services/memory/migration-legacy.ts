/** Legacy syntax is intentionally confined to the explicit migration. */
import * as fs from "node:fs";
import { join, basename, extname } from "node:path";
import { isFile, isDirectory, isSymlink, readText } from "./paths.js";
import { parseDocument } from "../../utils/node-tree/codec/document.js";
export const BUILTINS: Record<string, string> = {
  user: "users",
  feedback: "feedbacks",
  project: "projects",
  reference: "references",
  skills: "skills",
  agent_skills: "agent_skills",
};
const RENAMES: Record<string, string> = {
  skills: "managed",
  agent_skills: "referenced",
};
const START = "<!-- project-memory-type:start -->",
  END = "<!-- project-memory-type:end -->";
export interface LegacyType {
  name: string;
  directory: string;
  indexes: string[];
  module: "memory" | "skills";
  private: boolean;
  writable: boolean;
  format: "ordinary" | "skills";
  fields: Record<string, unknown>;
  synthetic: boolean;
  newName: string;
  relativeTarget: string;
}
function make(
  spec: Omit<LegacyType, "newName" | "relativeTarget">,
): LegacyType {
  const newName = RENAMES[spec.name] ?? spec.name;
  return {
    ...spec,
    newName,
    relativeTarget: join(
      ".harness",
      spec.module,
      RENAMES[spec.name] ? newName : basename(spec.directory),
    ),
  };
}
function metadata(text: string): Record<string, unknown> {
  if (text.includes(START) !== text.includes(END))
    throw new Error("malformed-type-metadata");
  const body = text.match(
    /<!-- project-memory-type:start -->\r?\n([\s\S]*?)<!-- project-memory-type:end -->/,
  )?.[1];
  return body ? (parseDocument(`---\n${body}---\n`).metadata ?? {}) : {};
}
export function parseLegacy(scope: string): LegacyType[] {
  const memory = join(scope, ".memory");
  if (isSymlink(memory)) throw new Error("legacy-memory-is-symlink");
  if (!isDirectory(memory)) throw new Error("legacy-memory-is-not-directory");
  const groups = new Map<string, LegacyType>();
  for (const file of fs.readdirSync(memory).sort()) {
    const path = join(memory, file);
    if (isSymlink(path)) throw new Error(`legacy-type-is-symlink: ${path}`);
    let candidates: string[], guessed: string;
    if (isDirectory(path)) {
      candidates = isFile(join(path, "AGENTS.md"))
        ? [join(path, "AGENTS.md")]
        : [];
      guessed = Object.keys(BUILTINS).find((n) => BUILTINS[n] === file) ?? file;
    } else if (/^[A-Z][A-Z0-9_]*\.md$/.test(file)) {
      candidates = [path];
      guessed = basename(path, extname(path)).toLowerCase();
    } else throw new Error(`unclassified-legacy-path: ${path}`);
    for (const index of candidates) {
      if (isSymlink(index))
        throw new Error(`legacy-index-is-symlink: ${index}`);
      const text = readText(index);
      if (
        !text.includes("<!-- project-memory-entries:start -->") ||
        !text.includes("<!-- project-memory-entries:end -->")
      )
        throw new Error(`missing-entry-block: ${index}`);
      const fields = metadata(text),
        name = String(fields.name ?? guessed);
      if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name))
        throw new Error("invalid-type-name");
      if (name in BUILTINS && name !== guessed)
        throw new Error(`official-type-identity-path-conflict: ${name}`);
      if (["managed", "referenced"].includes(name))
        throw new Error(`new-builtin-name-collision: ${name}`);
      if (
        !(name in BUILTINS) &&
        (!("writable" in fields) || !("gitignore" in fields))
      )
        throw new Error(`ambiguous-custom-privileges: ${name}`);
      for (const flag of ["writable", "gitignore", "index-only"])
        if (flag in fields && typeof fields[flag] !== "boolean")
          throw new Error(`invalid-type-flag: ${flag}`);
      const writable = Boolean(fields.writable ?? name !== "agent_skills"),
        priv = Boolean(fields.gitignore ?? name === "user"),
        format = fields.format ?? (name in RENAMES ? "skills" : "ordinary");
      if ("index-only" in fields && writable === fields["index-only"])
        throw new Error("conflicting-index-only-flag");
      if (format !== "ordinary" && format !== "skills")
        throw new Error("unknown-type-format");
      if (name === "user" && !priv) throw new Error("user-must-remain-private");
      if (name === "skills" && (!writable || format !== "skills"))
        throw new Error("managed-requires-writable-skills");
      if (name === "agent_skills" && (writable || format !== "skills"))
        throw new Error("referenced-requires-index-only-skills");
      const defaultModule = name in RENAMES ? "skills" : "memory",
        module = fields.module ?? defaultModule;
      if (module !== "memory" && module !== "skills")
        throw new Error("unsupported-legacy-module");
      if (
        name in BUILTINS &&
        (module !== defaultModule ||
          (!(name in RENAMES) && format !== "ordinary"))
      )
        throw new Error("ambiguous-legacy-module");
      const directory = join(
        memory,
        isDirectory(path)
          ? file
          : (BUILTINS[name] ?? (name.endsWith("s") ? name : name + "s")),
      );
      const current = make({
          name,
          directory,
          indexes: [index],
          module,
          private: priv,
          writable,
          format,
          fields,
          synthetic: false,
        }),
        previous = groups.get(name);
      if (previous) {
        if (
          previous.directory !== directory ||
          JSON.stringify(previous.fields) !== JSON.stringify(fields) ||
          !fs.readFileSync(previous.indexes[0]!).equals(fs.readFileSync(index))
        )
          throw new Error(`legacy-index-conflict: ${name}`);
        previous.indexes.push(index);
      } else groups.set(name, current);
    }
  }
  const local = readText(join(scope, "AGENTS.md")).match(
    /<!-- project-memory-local:start -->([\s\S]*?)<!-- project-memory-local:end -->/,
  )?.[1];
  if (local)
    for (const [name, dir] of Object.entries(BUILTINS)) {
      if (groups.has(name)) continue;
      const flat = `.memory/${name.toUpperCase()}.md`,
        nested = `.memory/${dir}/AGENTS.md`;
      if (local.includes(`](${flat})`) || local.includes(`](${nested})`))
        groups.set(
          name,
          make({
            name,
            directory: join(memory, dir),
            indexes: [
              join(scope, local.includes(`](${flat})`) ? flat : nested),
            ],
            module: name in RENAMES ? "skills" : "memory",
            private: name === "user",
            writable: name !== "agent_skills",
            format: name in RENAMES ? "skills" : "ordinary",
            fields: {},
            synthetic: true,
          }),
        );
    }
  for (const name of fs.readdirSync(memory)) {
    const path = join(memory, name);
    if (
      isDirectory(path) &&
      ![...groups.values()].some((t) => t.directory === path)
    ) {
      if (
        name === "users" &&
        isFile(join(scope, ".harness/memory/users/AGENTS.md"))
      )
        groups.set(
          "user",
          make({
            name: "user",
            directory: path,
            indexes: [],
            module: "memory",
            private: true,
            writable: true,
            format: "ordinary",
            fields: {},
            synthetic: false,
          }),
        );
      else throw new Error(`missing-type-index: ${path}`);
    }
  }
  return [...groups.values()];
}
export function convertIndex(text: string, spec: LegacyType): string {
  const values = {
    name: spec.newName,
    module: spec.module,
    writable: String(spec.writable),
    gitignore: String(spec.private),
    format: spec.format,
  };
  const match = text.match(
    /<!-- project-memory-type:start -->\r?\n[\s\S]*?<!-- project-memory-type:end -->/,
  );
  if (match) {
    let block = match[0];
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`^${key}:.*$`, "m");
      block = pattern.test(block)
        ? block.replace(pattern, `${key}: ${value}`)
        : block.replace(END, `${key}: ${value}\n${END}`);
    }
    return text.replace(match[0], () => block);
  }
  return (
    START +
    "\n" +
    Object.entries(values)
      .map(([k, v]) => `${k}: ${v}\n`)
      .join("") +
    END +
    "\n\n" +
    text
  );
}
