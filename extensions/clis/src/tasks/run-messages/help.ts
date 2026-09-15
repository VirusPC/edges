export const RUN_MESSAGES_AFTER_HELP = `
ARGUMENTS
  <run-id>  Stable run-id, or a short numeric n together with --task

FLAGS
  --task <stem>      Scope a short run-id to this Task
  --output <format>  table (default) or json

Read-only messages for one run. No append.

EXAMPLES
  edges tasks run-messages 2026-09-11--cli--1
  edges tasks run-messages 1 --task 2026-09-11--cli --output json
`;
