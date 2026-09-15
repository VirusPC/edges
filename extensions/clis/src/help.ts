/** Extra `--help` sections. Option names and the command tree come from Commander. */

export const ROOT_AFTER_HELP = `
EXAMPLES
  edges note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --help
  edges tasks --help

BREAKING RENAME
  The bin is edges only (not edges-note). There is no shim.
  Callers must migrate to: edges note --title … --content … --co-author …
`;
