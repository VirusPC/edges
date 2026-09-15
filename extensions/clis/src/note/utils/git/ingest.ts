import path from "node:path";
import { promises as fs } from "node:fs";
import type { IngestRequest, ScriptSuccess } from "../types.js";
import { createExecFile, type ExecFn } from "./exec.js";
import { formatMarkerStdout } from "./markers.js";
import { createPullRequest } from "./pr.js";
import { localDateYmd, titleToSlug } from "./slug.js";

export type IngestGitConfig = {
  repoPath: string;
  baseBranch: string;
  mode: "pr" | "direct";
  dryRun: boolean;
};

export type IngestGitDeps = {
  exec?: ExecFn;
  now?: Date;
  writeFile?: (absPath: string, contents: string) => Promise<void>;
  mkdirp?: (absDir: string) => Promise<void>;
  directoryExists?: (absPath: string) => Promise<boolean>;
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

  const exec = deps.exec ?? createExecFile();
  const now = deps.now ?? new Date();
  const writeFile = deps.writeFile ?? ((absPath, contents) => fs.writeFile(absPath, contents, "utf8"));
  const mkdirp = deps.mkdirp ?? ((absDir) => fs.mkdir(absDir, { recursive: true }).then(() => undefined));
  const directoryExists =
    deps.directoryExists ??
    (async (absPath) => {
      try {
        const st = await fs.stat(absPath);
        return st.isDirectory();
      } catch {
        return false;
      }
    });

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
  const filePath = `knowledge/notes/${date}--${slug}.md`;
  const absFile = path.join(config.repoPath, filePath);
  let branch = `ingest/${date}-${slug}`;

  if (!config.dryRun) {
    await exec("git", ["checkout", config.baseBranch], { cwd: config.repoPath, env });
    await exec("git", ["pull"], { cwd: config.repoPath, env });
  }

  if (config.mode === "direct") {
    branch = config.baseBranch;
    lines.push(`📝 Mode: Direct commit to ${config.baseBranch}`);
  } else {
    lines.push("🌿 Mode: Create branch and PR");
    await exec("git", ["checkout", "-b", branch], { cwd: config.repoPath, env });
  }

  await mkdirp(path.join(config.repoPath, "knowledge/notes"));
  await writeFile(absFile, renderNoteMarkdown(input.title, input.content, date));
  await exec("git", ["add", filePath], { cwd: config.repoPath, env });
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
