export const CREATE_AFTER_HELP = `
FLAGS
  --title <title>          Required. Task title
  --description <text>    One-line description
  --body <markdown>        Body after frontmatter
  --status <status>       Initial edges-tasks-status (default: backlog)
  --name <name>            frontmatter name
  --assignee <text>        edges-task-assignee
  --json                   Write JSON to stdout (always on)

Writes the Task file plus an empty sidecar .{stem}.log.md. No git.

EXAMPLES
  edges tasks create --title "Ship CLI layout"
`;
