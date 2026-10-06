export function filter<T, S extends T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => item is S,
): AsyncGenerator<S>;
export function filter<T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => boolean | Promise<boolean>,
): AsyncGenerator<T>;
export async function* filter<T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => boolean | Promise<boolean>,
): AsyncGenerator<T> {
  for await (const item of source) if (await predicate(item)) yield item;
}
