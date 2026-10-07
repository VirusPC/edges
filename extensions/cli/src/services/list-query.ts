export const MISSING_FIELD = "__undefined__";

export type FieldFilter = { field: string; value: string };

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function fieldText(record: Record<string, unknown>, field: string): string {
  if (!Object.prototype.hasOwnProperty.call(record, field) || record[field] === undefined) {
    return MISSING_FIELD;
  }
  const value = record[field];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return stableStringify(value);
}

export function matchesFilters(record: Record<string, unknown>, filters: FieldFilter[]): boolean {
  const byField = new Map<string, string[]>();
  for (const filter of filters) {
    const values = byField.get(filter.field) ?? [];
    values.push(filter.value);
    byField.set(filter.field, values);
  }
  for (const [field, values] of byField) {
    const text = fieldText(record, field);
    if (!values.includes(text)) return false;
  }
  return true;
}

export function groupRecords<T extends Record<string, unknown>>(
  records: T[],
  field: string,
): Array<{ key: string; items: T[] }> {
  const groups: Array<{ key: string; items: T[] }> = [];
  const index = new Map<string, { key: string; items: T[] }>();
  for (const record of records) {
    const key = fieldText(record, field);
    const existing = index.get(key);
    if (existing) {
      existing.items.push(record);
      continue;
    }
    const group = { key, items: [record] };
    index.set(key, group);
    groups.push(group);
  }
  return groups;
}

export function parseFieldFilter(raw: string): FieldFilter {
  const eq = raw.indexOf("=");
  if (eq <= 0) {
    throw new Error(`filter must be field=value: ${raw}`);
  }
  return { field: raw.slice(0, eq), value: raw.slice(eq + 1) };
}

/** Shared list envelope: filter first, then optional --group-by. */
export function presentListed<T extends Record<string, unknown>>(
  command: string,
  items: T[],
  opts: { filter?: string[]; groupBy?: string },
): Record<string, unknown> {
  const filters = (opts.filter ?? []).map(parseFieldFilter);
  const filtered = items.filter((item) => matchesFilters(item, filters));
  if (opts.groupBy) {
    return {
      command,
      groupBy: opts.groupBy,
      groups: groupRecords(filtered, opts.groupBy),
    };
  }
  return { command, items: filtered };
}
