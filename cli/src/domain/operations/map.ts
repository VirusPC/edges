export async function* map<T, U>(
  source: AsyncIterable<T>,
  transform: (item: T) => U | Promise<U>,
): AsyncGenerator<U> {
  for await (const item of source) yield await transform(item);
}
