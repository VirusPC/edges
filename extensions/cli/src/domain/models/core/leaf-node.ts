import { BaseNode } from "./base-node.js";
import type { NodeCreateInput, NodeUpdateInput } from "./types.js";
export class LeafNode<
  CreateInput extends NodeCreateInput = NodeCreateInput,
  UpdateInput extends NodeUpdateInput = NodeUpdateInput,
> extends BaseNode<CreateInput, UpdateInput> {
  override readonly type: string = "leaf";
  override get isLeaf(): boolean {
    return true;
  }
}
