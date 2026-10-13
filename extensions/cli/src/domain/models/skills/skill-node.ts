import * as nodePath from "node:path";
import { BaseNode } from "../core/base-node.js";
export class SkillNode extends BaseNode {
  override readonly type = "skill" as const;
  override validate(): void {
    super.validate();
    if (
      !this.name ||
      this.name.length > 64 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.name)
    )
      throw new Error(
        `${this.path}: name must be lowercase kebab-case, 1–64 characters.`,
      );
    if (!this.description?.trim())
      throw new Error(`${this.path}: description must be nonempty.`);
  }
  constructor(path: string) {
    super(path);
    if (nodePath.basename(this.path) !== "SKILL.md")
      throw new Error("Skill entry must be SKILL.md");
  }
}
