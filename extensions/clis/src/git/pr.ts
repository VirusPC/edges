import type { ExecFn } from "./exec.js";

export function repoPathFromRemote(remoteUrl: string): string | undefined {
  if (remoteUrl.startsWith("git@github.com:")) {
    return remoteUrl.slice("git@github.com:".length).replace(/\.git$/, "");
  }
  if (remoteUrl.startsWith("https://github.com/")) {
    return remoteUrl.slice("https://github.com/".length).replace(/\.git$/, "");
  }
  return undefined;
}

export function buildCompareUrl(input: {
  remoteUrl: string;
  baseBranch: string;
  branch: string;
  title: string;
  body: string;
}): string | undefined {
  const repo = repoPathFromRemote(input.remoteUrl);
  if (!repo) return undefined;
  const title = encodeURIComponent(input.title);
  const body = encodeURIComponent(input.body);
  return `https://github.com/${repo}/compare/${input.baseBranch}...${input.branch}?expand=1&title=${title}&body=${body}`;
}

export type CreatePrInput = {
  title: string;
  body: string;
  branch: string;
  baseBranch: string;
  remoteUrl: string;
  githubToken?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  exec: ExecFn;
  fetchJson?: (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
  ) => Promise<{ html_url?: string }>;
};

async function defaultFetchJson(
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
): Promise<{ html_url?: string }> {
  const res = await fetch(url, init);
  try {
    return (await res.json()) as { html_url?: string };
  } catch {
    return {};
  }
}

export async function createPullRequest(input: CreatePrInput): Promise<{
  created: boolean;
  htmlUrl?: string;
  compareUrl?: string;
}> {
  const compareUrl = buildCompareUrl(input);
  const execOpts = { cwd: input.cwd, env: input.env };
  try {
    await input.exec("gh", ["auth", "status"], execOpts);
    const created = await input.exec("gh", ["pr", "create", "--title", input.title, "--body", input.body], execOpts);
    const htmlUrl = created.stdout
      .split("\n")
      .map((s) => s.trim())
      .find((s) => s.startsWith("https://github.com/"));
    if (htmlUrl) {
      return { created: true, htmlUrl, compareUrl };
    }
  } catch {
    // fall through to token / compare URL
  }

  const repo = repoPathFromRemote(input.remoteUrl);
  if (input.githubToken && repo) {
    try {
      const fetchJson = input.fetchJson ?? defaultFetchJson;
      const payload = await fetchJson(`https://api.github.com/repos/${repo}/pulls`, {
        method: "POST",
        headers: {
          Authorization: `token ${input.githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          head: input.branch,
          base: input.baseBranch,
        }),
      });
      if (payload.html_url) {
        return { created: true, htmlUrl: payload.html_url, compareUrl };
      }
    } catch {
      // fall through to compare URL — push already succeeded
    }
  }

  return { created: false, compareUrl };
}
