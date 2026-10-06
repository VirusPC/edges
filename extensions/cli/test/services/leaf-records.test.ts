import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { deleteNote, getNote, listNotes, updateNote } from "../../src/services/note/records.js";
import { deleteSkill, getSkill, listSkills } from "../../src/services/skills/records.js";

test("note records list get update and delete an entry", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-notes-"));
  const file = path.join(repo, "notes", "demo", "index.md");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, "# Hello\n\nBody\n");
  assert.deepEqual(listNotes(repo), [{ stem: "demo", path: "notes/demo/index.md" }]);
  assert.equal(getNote(repo, "notes/demo/index.md").title, "Hello");
  updateNote(repo, "notes/demo/index.md", { title: "Next" });
  assert.match(await readFile(file, "utf8"), /^# Next/);
  deleteNote(repo, "notes/demo/index.md");
  assert.deepEqual(listNotes(repo), []);
});

test("skill records find by name and delete the directory", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-skills-"));
  const file = path.join(repo, ".agents", "skills", "demo", "SKILL.md");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, "# Demo\n");
  assert.equal(listSkills(repo)[0]?.name, "demo");
  assert.equal(getSkill(repo, "demo").path, ".agents/skills/demo/SKILL.md");
  deleteSkill(repo, "demo");
  assert.deepEqual(listSkills(repo), []);
});
