import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { readProcessInput } from "../../src/utils/process-input.js";

function stdinFrom(text: string): NodeJS.ReadableStream {
  return Readable.from([Buffer.from(text)]);
}

test("readProcessInput drops node and script from argv", async () => {
  const input = await readProcessInput(["node", "src/index.ts", "note", "--help"], {
    stdin: stdinFrom("unused"),
    isTTY: true,
  });
  assert.deepEqual(input.argv, ["note", "--help"]);
  assert.equal(input.stdinText, undefined);
  assert.equal(input.stdinIsTTY, true);
});

test("readProcessInput does not drain stdin without --token-stdin", async () => {
  const stdin = stdinFrom("secret\n");
  const input = await readProcessInput(["node", "edges", "note", "--title", "x"], {
    stdin,
    isTTY: false,
  });
  assert.equal(input.stdinText, undefined);
});

test("readProcessInput drains stdin when --token-stdin and not a TTY", async () => {
  const input = await readProcessInput(["node", "edges", "note", "--token-stdin"], {
    stdin: stdinFrom("secret\n"),
    isTTY: false,
  });
  assert.equal(input.stdinText, "secret\n");
  assert.equal(input.stdinIsTTY, false);
});

test("readProcessInput skips stdin on a TTY even with --token-stdin", async () => {
  const input = await readProcessInput(["node", "edges", "note", "--token-stdin"], {
    stdin: stdinFrom("secret\n"),
    isTTY: true,
  });
  assert.equal(input.stdinText, undefined);
  assert.equal(input.stdinIsTTY, true);
});
