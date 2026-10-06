import { TASK_STATUSES, TASK_PRIORITIES } from "../../../cli/src/domain/models/tasks/types.js";

export const REVIEW_STATUS_COLUMNS = TASK_STATUSES;
export const REVIEW_PRIORITIES = TASK_PRIORITIES;
export type ReviewStatus = (typeof REVIEW_STATUS_COLUMNS)[number];
export type ReviewPriority = (typeof REVIEW_PRIORITIES)[number];
