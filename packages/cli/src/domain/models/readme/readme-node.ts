import { EntriesNode, type EntriesCreateInput } from "../node/entries-node.js";

export interface ReadmeCreateInput extends EntriesCreateInput {}

/** README.md content organization list. */
export class ReadmeNode extends EntriesNode {
  override readonly type = "readme";
}
