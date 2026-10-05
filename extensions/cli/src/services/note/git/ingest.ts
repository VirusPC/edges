import { assertImportType } from "../../import-entry.js";
import { existsSync } from "node:fs";
import { NodeService } from "../../node-service.js";
import { NoteNode } from "../../../models/note-node.js";
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

function renderNoteMarkdown(
  title: string,
  content: string,
  date: string,
): string {
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

  const exec = deps.exec ?? createExecFile();
  const now = deps.now ?? new Date();
  const directoryExists = async (absPath: string) => {
    try {
      return (await fs.stat(absPath)).isDirectory();
    } catch {
      return false;
    }
  };

  if (!(await directoryExists(config.repoPath))) {
    throw new Error(
      `error: repository path does not exist: ${config.repoPath}`,
    );
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
  const directoryFile = path.join(
    scope,
    `knowledge/notes/${date}--${slug}/index.md`,
  );
  const selectNoteFile = () => directoryFile;
  // Validate document input before any Git branch or destination changes.
  const draft = new NoteNode(
    input.importEntry ? path.resolve(input.importEntry) : directoryFile,
  );
  if (input.importEntry && path.basename(input.importEntry) !== "index.md")
    throw new Error(`${input.importEntry}: Note import requires index.md`);
  if (input.importEntry) assertImportType(input.importEntry, "note");
  if (input.markdown || input.importEntry) draft.parse(input.content);
  else {
    draft.body = renderNoteMarkdown(input.title, input.content, date);
    draft.title = input.title;
  }
  draft.validate();
  const repoRoot = await fs.realpath(config.repoPath);
  const relativeFile = (absFile: string) => {
    const filePath = path.relative(repoRoot, absFile);
    if (filePath.startsWith("..") || path.isAbsolute(filePath))
      throw new Error("Note scope must be inside its Git repository");
    return filePath;
  };
  relativeFile(selectNoteFile());
  let branch = `ingest/${date}-${slug}`;

  if (!config.dryRun) {
    await exec("git", ["checkout", config.baseBranch], {
      cwd: config.repoPath,
      env,
    });
    await exec("git", ["pull", "--autostash"], { cwd: config.repoPath, env });
  }

  const absFile = selectNoteFile();
  const filePath = relativeFile(absFile);

  if (config.mode === "direct") {
    branch = config.baseBranch;
    lines.push(`📝 Mode: Direct commit to ${config.baseBranch}`);
  } else {
    lines.push("🌿 Mode: Create branch and PR");
    await exec("git", ["checkout", "-b", branch], {
      cwd: config.repoPath,
      env,
    });
  }

  const parentIndex = path.join(scope, "knowledge/notes/AGENTS.md");
  const parentBefore = existsSync(parentIndex)
    ? await fs.readFile(parentIndex, "utf8")
    : undefined;
  if (!existsSync(absFile) && parentBefore !== undefined) {
    const status = await exec(
      "git",
      ["status", "--porcelain", "--", relativeFile(parentIndex)],
      { cwd: config.repoPath, env },
    );
    if (status.stdout.trim())
      throw new Error(
        `Note parent index has uncommitted changes; preserve and commit them before ingest: ${parentIndex}`,
      );
  }
  const service = new NodeService({
    managedRoot: path.join(scope, "knowledge/notes"),
    assertWrite: ({ node }) => {
      const relative = path.relative(
        path.join(scope, "knowledge/notes"),
        node.path,
      );
      if (relative.startsWith("..") || path.isAbsolute(relative))
        throw new Error("Note must remain in the selected scope");
    },
  });
  let note: NoteNode;
  if (input.importEntry)
    note = (await service.import(
      path.resolve(input.importEntry),
      absFile,
    )) as NoteNode;
  else {
    const previous = await service.get(absFile, NoteNode);
    note = previous ?? new NoteNode(absFile);
    const fields = { metadata: draft.metadata, body: draft.body };
    if (previous) await service.update(note, fields);
    else await service.create(note, fields);
  }
  const addPath = path.relative(repoRoot, note.directoryPath);
  const addPaths = [addPath];
  if (
    parentBefore !== undefined &&
    (await fs.readFile(parentIndex, "utf8")) !== parentBefore
  )
    addPaths.push(relativeFile(parentIndex));
  await exec("git", ["add", ...addPaths], { cwd: config.repoPath, env });
  await exec(
    "git",
    [
      "commit",
      "-m",
      `ingest: ${input.title}\n\nCo-authored-by: ${input.coAuthor}\n`,
    ],
    { cwd: config.repoPath, env },
  );

  if (!config.dryRun) {
    if (config.mode === "direct") {
      await exec("git", ["push"], { cwd: config.repoPath, env });
    } else {
      await exec("git", ["push", "-u", "origin", branch], {
        cwd: config.repoPath,
        env,
      });
    }
  }

  let prStatus: "created" | "unavailable" | "direct_commit" = "direct_commit";
  let prUrl: string | undefined;

  if (config.mode === "direct") {
    prStatus = "direct_commit";
  } else {
    const remoteUrl = config.dryRun
      ? "https://github.com/example/repo"
      : (
          await exec("git", ["remote", "get-url", "origin"], {
            cwd: config.repoPath,
            env,
          })
        ).stdout.trim();
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
      lines.push(
        "💡 Tip: Set GITHUB_TOKEN or run 'gh auth login' for auto PR creation",
      );
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
