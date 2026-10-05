import { existsSync } from 'node:fs';
import { NodeService } from '../../node-service.js';
import { NoteNode } from '../../../models/note-node.js';
import path from "node:path";
import { promises as fs } from "node:fs";
import type { IngestRequest, ScriptSuccess } from "../types.js";
import { createExecFile, type ExecFn } from "./exec.js";
import { formatMarkerStdout } from "./markers.js";
import { createPullRequest } from "./pr.js";
import { localDateYmd, titleToSlug } from "./slug.js";

export type IngestGitConfig = {
  repoPath: string;
  scopeDir?: string;
  baseBranch: string;
  mode: "pr" | "direct";
  dryRun: boolean;
};

export type IngestGitDeps = {
  exec?: ExecFn;
  now?: Date;
  fetchJson?: CreatePrFetch;
};

type CreatePrFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ html_url?: string }>;

function renderNoteMarkdown(title: string, content: string, date: string): string {
  return `# ${title}\n\n> Ingested on ${date}\n\n${content}\n`;
}

export async function runNoteIngest(
  input: IngestRequest,
  config: IngestGitConfig,
  env: NodeJS.ProcessEnv = process.env,
  deps: IngestGitDeps = {},
): Promise<ScriptSuccess> {
  if (!input.title || !input.content || !input.coAuthor) {
    throw new Error('usage: new-note "title" "content" "AI Name <email>"');
  }

  if (input.format !== undefined && input.format !== 'file' && input.format !== 'directory') throw new Error('Invalid note entry format');
  if (input.resources && input.format !== 'directory') throw new Error('Resource import requires directory format');
  if (input.resources) throw new Error('Import an entry directory with NodeService.import; resource-only imports are no longer supported');
  const exec = deps.exec ?? createExecFile();
  const now = deps.now ?? new Date();
  const directoryExists = async (absPath: string) => {
    try { return (await fs.stat(absPath)).isDirectory(); } catch { return false; }
  };

  if (!(await directoryExists(config.repoPath))) {
    throw new Error(`error: repository path does not exist: ${config.repoPath}`);
  }

  try {
    await exec("git", ["--version"]);
  } catch (error) {
    throw Object.assign(new Error("error: git is required"), {
      code: (error as NodeJS.ErrnoException).code,
    });
  }

  const lines: string[] = [];
  const date = localDateYmd(now);
  const slug = titleToSlug(input.title, now);
  const scope = await fs.realpath(config.scopeDir ?? config.repoPath);
  const flatFile = path.join(scope, `knowledge/notes/${date}--${slug}.md`);
  const directoryFile = path.join(scope, `knowledge/notes/${date}--${slug}/index.md`);
  const selectNoteFile = () => {
    const flatExists = existsSync(flatFile);
    const directoryEntryExists = existsSync(directoryFile);
    if (flatExists && directoryEntryExists) throw new Error('Ambiguous file and directory note entries');
    const existingFormat = directoryEntryExists ? 'directory' : flatExists ? 'file' : undefined;
    if (input.format && existingFormat && input.format !== existingFormat) throw new Error('Existing note layout differs; implicit conversion is not supported');
    const selectedFile = (input.format ?? existingFormat) === 'directory' ? directoryFile : flatFile;
    if (input.resources && directoryEntryExists) throw new Error('Resource import only supports new directory entries');
    return selectedFile;
  };
  const repoRoot = await fs.realpath(config.repoPath);
  const relativeFile = (absFile: string) => {
    const filePath = path.relative(repoRoot, absFile);
    if (filePath.startsWith("..") || path.isAbsolute(filePath)) throw new Error("Note scope must be inside its Git repository");
    return filePath;
  };
  relativeFile(selectNoteFile());
  let branch = `ingest/${date}-${slug}`;

  if (!config.dryRun) {
    await exec("git", ["checkout", config.baseBranch], { cwd: config.repoPath, env });
    await exec("git", ["pull", "--autostash"], { cwd: config.repoPath, env });
  }

  const absFile = selectNoteFile();
  const filePath = relativeFile(absFile);

  if (config.mode === "direct") {
    branch = config.baseBranch;
    lines.push(`📝 Mode: Direct commit to ${config.baseBranch}`);
  } else {
    lines.push("🌿 Mode: Create branch and PR");
    await exec("git", ["checkout", "-b", branch], { cwd: config.repoPath, env });
  }

  const service = new NodeService({ managedRoot: path.join(scope, 'knowledge/notes'), assertWrite: ({ node }) => {
    const relative = path.relative(path.join(scope, 'knowledge/notes'), node.path);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Note must remain in the selected scope');
  } });
  const previous = await service.get(absFile, NoteNode);
  const note = previous ?? new NoteNode(absFile);
  if (input.markdown) note.parse(input.content);
  else { note.body = renderNoteMarkdown(input.title, input.content, date); note.title = input.title; }
  if (previous) await service.update(note, {}); else await service.create(note, { metadata: note.metadata, body: note.body });
  const addPath = note.directoryPath ? path.relative(await fs.realpath(config.repoPath), note.directoryPath) : filePath;
  await exec("git", ["add", addPath], { cwd: config.repoPath, env });
  await exec(
    "git",
    ["commit", "-m", `ingest: ${input.title}\n\nCo-authored-by: ${input.coAuthor}\n`],
    { cwd: config.repoPath, env },
  );

  if (!config.dryRun) {
    if (config.mode === "direct") {
      await exec("git", ["push"], { cwd: config.repoPath, env });
    } else {
      await exec("git", ["push", "-u", "origin", branch], { cwd: config.repoPath, env });
    }
  }

  let prStatus: "created" | "unavailable" | "direct_commit" = "direct_commit";
  let prUrl: string | undefined;

  if (config.mode === "direct") {
    prStatus = "direct_commit";
  } else {
    const remoteUrl = config.dryRun
      ? "https://github.com/example/repo"
      : (await exec("git", ["remote", "get-url", "origin"], { cwd: config.repoPath, env })).stdout.trim();
    const prBody = `Auto-ingested with AI assistance.\n\nCo-authored-by: ${input.coAuthor}`;
    const pr = await createPullRequest({
      title: input.title,
      body: prBody,
      branch,
      baseBranch: config.baseBranch,
      remoteUrl,
      githubToken: env.GITHUB_TOKEN,
      cwd: config.repoPath,
      env,
      exec,
      fetchJson: deps.fetchJson,
    });
    if (pr.htmlUrl) {
      prStatus = "created";
      prUrl = pr.htmlUrl;
      lines.push(`🔗 PR created: ${pr.htmlUrl}`);
    } else {
      prStatus = "unavailable";
      prUrl = pr.compareUrl;
      if (pr.compareUrl) lines.push(`📎 Create PR: ${pr.compareUrl}`);
      lines.push("💡 Tip: Set GITHUB_TOKEN or run 'gh auth login' for auto PR creation");
    }
  }

  lines.push(`✅ Ingested: ${filePath}`);
  lines.push(formatMarkerStdout({ filePath, branch, prStatus, prUrl }));

  return {
    filePath,
    branch,
    prUrl,
    prStatus,
    stdout: `${lines.join("\n")}\n`,
  };
}
