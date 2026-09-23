import taskDocSchema from "../../../extensions/clis/schemas/task-doc.v1.json" with { type: "json" };

const metadata = taskDocSchema.properties.metadata.properties;

export const REVIEW_STATUS_COLUMNS = metadata["edges-tasks-status"].enum;
export const REVIEW_PRIORITIES = metadata["edges-task-priority"].enum;

export type ReviewStatus = (typeof REVIEW_STATUS_COLUMNS)[number];
export type ReviewPriority = (typeof REVIEW_PRIORITIES)[number];
