/** Build-time registry. Runtime consumers read the generated manifest. */
export const SCHEMA_CONTRACTS = [{
  key: 'task-doc/v1',
  path: 'src/domain/models/tasks/task-doc-contract.ts',
  type: 'TaskDoc',
  file: 'task-doc.v1.json',
  id: 'edges.task-doc/v1',
}] as const;
