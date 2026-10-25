import * as nodePath from "node:path";
import { BaseNode } from "../../core/base-node.js";
import { ENTRY_NAMES } from "../../config/layout.js";
export class RoutineNode extends BaseNode {
  override readonly type = "routine" as const;

  constructor(path: string) {
    super(path);
    if (nodePath.basename(this.path) !== ENTRY_NAMES.leaf)
      throw new Error(`Routine entry must be ${ENTRY_NAMES.leaf}`);
  }

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
}
