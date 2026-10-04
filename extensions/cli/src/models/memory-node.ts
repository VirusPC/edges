import { BaseNode } from './base-node.js';
import { domainFields, scalar, setDomainField } from './fields.js';
import type { Metadata } from './types.js';

export class MemoryNode extends BaseNode<'memory'> {
  override readonly type = 'memory' as const;
  protected override validateMetadata(metadata: Metadata | undefined): void { super.validateMetadata(metadata); domainFields(metadata); }
  get memoryType(): string | undefined { return scalar(domainFields(this.metadata)['edges-type'] ?? this.metadata?.type) || undefined; }
  set memoryType(value: string | undefined) {
    setDomainField(this, 'edges-type', value);
    this.removeMetadata('type');
  }
  get description(): string | undefined { return scalar(this.metadata?.description) || undefined; }
  set description(value: string | undefined) { if (value === undefined) this.removeMetadata('description'); else this.setMetadata('description', value); }
}
