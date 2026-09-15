export const STATUS_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path
  <status>  Next edges-tasks-status: backlog | todo | in_progress | in_review | done | blocked | cancelled

FLAGS
  --json  Write JSON to stdout (always on)

Moves the Task file and its sidecar. Cancel with: cancelled. There is no delete command.

EXAMPLES
  edges tasks status 2026-09-11--cli in_progress
  edges tasks status 2026-09-11--cli cancelled
`;
