import test from "node:test";
import assert from "node:assert/strict";
import { SkillNode } from "../../src/domain/models/skill-node.js";
test("Skill validates required standard fields only after staged input is complete", () => {
  const node = new SkillNode("/tmp/example/SKILL.md");
  node.name = "example";
  assert.throws(() => node.validate(), /SKILL.md.*description/);
  node.description = "Use for examples";
  node.validate();
  for (const name of ["", "Bad_Name", "-bad", "a".repeat(65)]) {
    const draft = new SkillNode("/tmp/example/SKILL.md").parse(
      `---\nname: ${JSON.stringify(name)}\ndescription: Use this\n---\nBody`,
    );
    assert.throws(() => draft.validate(), /SKILL.md.*name/);
  }
  assert.throws(
    () =>
      new SkillNode("/tmp/example/SKILL.md")
        .parse("# Missing fields")
        .validate(),
    /SKILL.md.*name/,
  );
});
