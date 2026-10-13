export async function mapValues<V, U>(
  record: Record<PropertyKey, V>,
  transform: (value: V, key: string) => U | Promise<U>,
): Promise<Record<PropertyKey, U>> {
  const result: Record<PropertyKey, U> = {};
  for (const [key, value] of Object.entries(record))
    Object.defineProperty(result, key, {
      value: await transform(value, key),
      writable: true, enumerable: true, configurable: true,
    });
  return result;
}
