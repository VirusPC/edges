import { basename, extname } from 'node:path';
import { BaseNode } from './base-node.js';
import { domainFields, scalar, setDomainField } from './fields.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../tasks/utils/types.js';
import type { Metadata, TaskPriority, TaskStatus } from './types.js';

export class TaskNode extends BaseNode<'task'> {
  override readonly type = 'task' as const;
  protected override validateMetadata(metadata: Metadata | undefined): void {
    super.validateMetadata(metadata);
    const fields = domainFields(metadata);
    for (const [key, allowed] of [['edges-tasks-status', TASK_STATUSES], ['edges-task-priority', TASK_PRIORITIES]] as const) {
      const value = fields[key];
      if (value !== undefined && value !== '' && !(allowed as readonly unknown[]).includes(value)) throw new Error(`Invalid ${key}: ${String(value)}`);
    }
  }
  get title(): string { return scalar(domainFields(this.metadata)['edges-title']) || scalar(this.metadata?.name) || basename(this.path, extname(this.path)); }
  set title(value: string) { setDomainField(this, 'edges-title', value); }
  get status(): TaskStatus { return (domainFields(this.metadata)['edges-tasks-status'] || 'backlog') as TaskStatus; }
  set status(value: TaskStatus) {
    if (!TASK_STATUSES.includes(value)) throw new Error(`Invalid task status: ${String(value)}`);
    setDomainField(this, 'edges-tasks-status', value);
  }
  get priority(): TaskPriority { return (domainFields(this.metadata)['edges-task-priority'] || 'none') as TaskPriority; }
  set priority(value: TaskPriority) {
    if (!TASK_PRIORITIES.includes(value)) throw new Error(`Invalid task priority: ${String(value)}`);
    setDomainField(this, 'edges-task-priority', value);
  }
  get assignee(): string | undefined { return scalar(domainFields(this.metadata)['edges-task-assignee']) || undefined; }
  set assignee(value: string | undefined) { setDomainField(this, 'edges-task-assignee', value); }
}
