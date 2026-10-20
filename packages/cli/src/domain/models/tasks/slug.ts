import { localDateYmd } from "../../../utils/date.js";
import { directoryStem } from "../node/stem.js";

export function taskFileSlug(title: string): string {
  return directoryStem(title, { fallback: "task", maxLength: 80 });
}

export function taskNameSlug(title: string): string {
  return directoryStem(title, { separator: "_", lowercase: true, fallback: "task" });
}

export function newTaskStem(title: string, now: Date): string {
  return `${localDateYmd(now)}--${taskFileSlug(title)}`;
}
