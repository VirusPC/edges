import * as nodePath from "node:path";
import { LeafNode } from "./leaf-node.js";
export class SkillNode extends LeafNode {
  override readonly type = "skill" as const;
  constructor(path: string) {
    super(path);
    if (nodePath.basename(this.path) !== "SKILL.md")
      throw new Error("Skill entry must be SKILL.md");
  }
}
