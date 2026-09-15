export type PrStatus = "created" | "unavailable" | "direct_commit";

export type IngestMarkers = {
  filePath: string;
  branch: string;
  prStatus: PrStatus;
  prUrl?: string;
};

const FILE_MARKER = "__EDGES_FILE__=";
const BRANCH_MARKER = "__EDGES_BRANCH__=";
const PR_URL_MARKER = "__EDGES_PR_URL__=";
const PR_STATUS_MARKER = "__EDGES_PR_STATUS__=";

function pick(stdout: string, marker: string): string | undefined {
  const line = stdout
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s.startsWith(marker));
  return line?.slice(marker.length).trim();
}

export function formatMarkerStdout(markers: IngestMarkers): string {
  const url = markers.prUrl ?? "";
  return [
    `${FILE_MARKER}${markers.filePath}`,
    `${BRANCH_MARKER}${markers.branch}`,
    `${PR_STATUS_MARKER}${markers.prStatus}`,
    `${PR_URL_MARKER}${url}`,
  ].join("\n");
}

export function parseMarkers(stdout: string): {
  filePath?: string;
  branch?: string;
  prStatus?: PrStatus;
  prUrl?: string;
  diagnostics: string;
} {
  const prStatusRaw = pick(stdout, PR_STATUS_MARKER);
  let prStatus: PrStatus | undefined;
  if (prStatusRaw === "created" || prStatusRaw === "unavailable" || prStatusRaw === "direct_commit") {
    prStatus = prStatusRaw;
  }
  const diagnostics = stdout
    .split("\n")
    .filter((line) => !line.trim().startsWith("__EDGES_"))
    .join("\n")
    .trim();
  const prUrl = pick(stdout, PR_URL_MARKER);
  return {
    filePath: pick(stdout, FILE_MARKER),
    branch: pick(stdout, BRANCH_MARKER),
    prStatus,
    prUrl: prUrl || undefined,
    diagnostics,
  };
}
