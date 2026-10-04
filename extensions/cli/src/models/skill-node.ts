import { BaseNode } from './base-node.js';
import { scalar } from './fields.js';
export class SkillNode extends BaseNode<'skill'> {
  override readonly type = 'skill' as const;
  get name(): string { return scalar(this.metadata?.name); }
  set name(value: string) { this.setMetadata('name', value); }
  get description(): string { return scalar(this.metadata?.description); }
  set description(value: string) { this.setMetadata('description', value); }
}
