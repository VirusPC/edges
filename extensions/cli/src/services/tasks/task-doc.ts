import { Ajv, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import type { TaskDoc } from '../../domain/models/tasks/task-doc.js';
import { TasksError } from '../../domain/models/tasks/types.js';
import { readSchemaArtifact } from '../../utils/schema-artifacts.js';

let validate: ValidateFunction<TaskDoc> | undefined;

/** External JSON boundary only. Markdown parsing intentionally keeps its scalar policy. */
export function validateTaskDocInput(raw: unknown, label = 'doc'): TaskDoc {
  if (!validate) {
    const ajv = new Ajv({ allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false });
    addFormats.default(ajv);
    validate = ajv.compile<TaskDoc>(JSON.parse(readSchemaArtifact('task-doc/v1')));
  }
  if (!validate(raw)) {
    const errors = validate.errors?.map(error => {
      const field = error.keyword === 'required' ? `/${error.params.missingProperty}`
        : error.keyword === 'additionalProperties' ? `/${error.params.additionalProperty}` : '';
      return `${label}${error.instancePath}${field} ${error.message}`;
    }).join('; ');
    throw new TasksError('VALIDATION_ERROR', errors ?? `${label} violates TaskDoc contract`);
  }
  return raw;
}
