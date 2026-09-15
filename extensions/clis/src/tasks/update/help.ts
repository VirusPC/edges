export const UPDATE_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path

FLAGS
  --title <title>
  --description <text>
  --body <markdown>
  --assignee <text>
  --json  Write JSON to stdout (always on)

Patches fields in place. Does not move the file; use status to change edges-tasks-status.

EXAMPLES
  edges tasks update 2026-09-11--cli --assignee "Codex"
`;
