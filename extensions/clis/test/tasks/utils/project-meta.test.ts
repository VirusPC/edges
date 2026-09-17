import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PROJECT_DESCRIPTION,
  DEFAULT_PROJECT_TITLE,
  parseProjectAgents,
  parseProjectDescription,
  parseProjectTitle,
  renderProjectAgents,
  seedDescriptionFor,
  seedTitleFor,
} from "../../../src/tasks/utils/project-meta.js";

test("seed copy for default and user slugs", () => {
  assert.equal(DEFAULT_PROJECT_TITLE, "Default");
  assert.equal(
    DEFAULT_PROJECT_DESCRIPTION,
    "Ungrouped tasks that have not been assigned a named Task Project.",
  );
  assert.equal(seedTitleFor("default"), "Default");
  assert.equal(seedTitleFor("cli"), "cli");
  assert.equal(seedDescriptionFor("default"), DEFAULT_PROJECT_DESCRIPTION);
  assert.equal(seedDescriptionFor("cli"), "Task Project cli.");
});

test("parseProjectTitle and parseProjectDescription accept trimmed bounds", () => {
  assert.equal(parseProjectTitle("  CLI  "), "CLI");
  assert.equal(parseProjectDescription("  edges CLI work  "), "edges CLI work");
  for (const raw of ["", "   ", "x".repeat(121), "has\nnewline"]) {
    try {
      parseProjectTitle(raw);
      assert.fail(`expected title throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /invalid Task Project title/);
    }
  }
  for (const raw of ["", "   ", "x".repeat(2001)]) {
    try {
      parseProjectDescription(raw);
      assert.fail(`expected description throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /invalid Task Project description/);
    }
  }
});

test("render and parse round-trip title, description, and optional pointers", () => {
  const rendered = renderProjectAgents({
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });
  assert.equal(
    rendered,
    `# Default\n\nUngrouped tasks that have not been assigned a named Task Project.\n`,
  );
  assert.deepEqual(parseProjectAgents(rendered), {
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });

  const withPointers = renderProjectAgents({
    title: "CLI",
    description: "edges CLI work",
    pointers: "## Pointers\n\n- [readme](../../../extensions/clis/README.md)",
  });
  const parsed = parseProjectAgents(withPointers);
  assert.equal(parsed.title, "CLI");
  assert.equal(parsed.description, "edges CLI work");
  assert.match(parsed.pointers ?? "", /README.md/);
});

test("parseProjectAgents rejects frontmatter and project-memory markers", () => {
  try {
    parseProjectAgents("---\nname: x\n---\n# T\n\nD\n");
    assert.fail("expected frontmatter throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /must not have YAML frontmatter/);
  }
  try {
    parseProjectAgents("# T\n\nD\n\n<!-- project-memory:start -->\n");
    assert.fail("expected project-memory throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /must not contain project-memory markers/);
  }
});
