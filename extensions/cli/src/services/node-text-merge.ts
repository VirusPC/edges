/** Exact source spans: merge disjoint line edits, refuse overlapping authored changes. */
import { diffLines } from "diff";
interface Edit {
  start: number;
  end: number;
  value: string;
}
function edits(before: string, after: string): Edit[] {
  const result: Edit[] = [];
  let offset = 0;
  let pending: Edit | undefined;
  for (const part of diffLines(before, after)) {
    if (part.added || part.removed) {
      pending ??= { start: offset, end: offset, value: "" };
      if (part.added) pending.value += part.value;
      else {
        offset += part.value.length;
        pending.end = offset;
      }
    } else {
      if (pending) result.push(pending);
      pending = undefined;
      offset += part.value.length;
    }
  }
  if (pending) result.push(pending);
  return result;
}
export function mergeText(
  base: string,
  dirty: string,
  committed: string,
  file: string,
): string {
  if (committed === base || dirty === committed) return dirty;
  if (dirty === base) return committed;
  const local = edits(base, dirty),
    remote = edits(base, committed);
  const combined = [...local];
  for (const next of remote) {
    let duplicate = false;
    for (const prior of local) {
      if (
        prior.start === next.start &&
        prior.end === next.end &&
        prior.value === next.value
      ) {
        duplicate = true;
        break;
      }
      const overlap =
        prior.start === prior.end
          ? prior.start >= next.start && prior.start <= next.end
          : next.start === next.end
            ? next.start >= prior.start && next.start <= prior.end
            : prior.start < next.end && next.start < prior.end;
      if (overlap)
        throw new Error(
          `Cached node edit conflict: ${file} (body); reload and reconcile unsaved edits`,
        );
    }
    if (!duplicate) combined.push(next);
  }
  let result = base;
  for (const edit of combined.sort((a, b) => b.start - a.start))
    result = result.slice(0, edit.start) + edit.value + result.slice(edit.end);
  return result;
}
