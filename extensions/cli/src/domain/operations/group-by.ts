export async function groupBy<T, K>(
  source: AsyncIterable<T>,
  keyOf: (item: T) => K | Promise<K>,
): Promise<Record<PropertyKey, T[]>> {
  const result: Record<PropertyKey, T[]> = {};
  for await (const item of source) {
    // Computed property keys use ToPropertyKey (including symbol wrappers).
    const key = Reflect.ownKeys({ [(await keyOf(item)) as PropertyKey]: true })[0]!;
    if (Object.hasOwn(result, key)) result[key]!.push(item);
    else Object.defineProperty(result, key, {
      value: [item], writable: true, enumerable: true, configurable: true,
    });
  }
  return result;
}
