export function find<T, S extends T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => item is S,
): Promise<S | undefined>;
export function find<T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => boolean | Promise<boolean>,
): Promise<T | undefined>;
export async function find<T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => boolean | Promise<boolean>,
): Promise<T | undefined> {
  for await (const item of source) if (await predicate(item)) return item;
  return undefined;
}
