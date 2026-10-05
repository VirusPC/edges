/** Explicit, repeatable async computation. Only value() executes a chain. */
export interface Deferred<T> {
  value(): Promise<T>;
  thru<U>(transform: (value: T) => U | Promise<U>): Deferred<U>;
}
export interface CollectionQuery<T, Result> extends Deferred<Result> {
  filter<S extends T>(predicate: (item: T) => item is S): AsyncQuery<S>;
  filter(predicate: (item: T) => boolean | Promise<boolean>): AsyncQuery<T>;
  map<U>(transform: (item: T) => U | Promise<U>): AsyncQuery<U>;
  find<S extends T>(predicate: (item: T) => item is S): Deferred<S | undefined>;
  find(
    predicate: (item: T) => boolean | Promise<boolean>,
  ): Deferred<T | undefined>;
  groupBy<K>(keyOf: (item: T) => K | Promise<K>): ObjectQuery<T[]>;
  toArray(): AsyncQuery<T>;
}
export interface AsyncQuery<T> extends CollectionQuery<T, T[]> {}
export interface ObjectQuery<V>
  extends CollectionQuery<V, Record<PropertyKey, V>> {
  mapValues<U>(
    transform: (value: V, key: string) => U | Promise<U>,
  ): ObjectQuery<U>;
  values(): AsyncQuery<V>;
}
function deferred<T>(evaluate: () => T | Promise<T>): Deferred<T> {
  return {
    async value() {
      return evaluate();
    },
    thru<U>(transform: (value: T) => U | Promise<U>) {
      return deferred(async () => transform(await evaluate()));
    },
  };
}
async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of source) result.push(item);
  return result;
}
function collection<T, R>(
  source: () => AsyncIterable<T>,
  evaluate: () => Promise<R>,
): CollectionQuery<T, R> {
  function filter<S extends T>(
    predicate: (item: T) => item is S,
  ): AsyncQuery<S>;
  function filter(
    predicate: (item: T) => boolean | Promise<boolean>,
  ): AsyncQuery<T>;
  function filter(
    predicate: (item: T) => boolean | Promise<boolean>,
  ): AsyncQuery<T> {
    return query(async function* () {
      for await (const item of source()) if (await predicate(item)) yield item;
    });
  }
  function find<S extends T>(
    predicate: (item: T) => item is S,
  ): Deferred<S | undefined>;
  function find(
    predicate: (item: T) => boolean | Promise<boolean>,
  ): Deferred<T | undefined>;
  function find(
    predicate: (item: T) => boolean | Promise<boolean>,
  ): Deferred<T | undefined> {
    return deferred(async () => {
      for await (const item of source()) if (await predicate(item)) return item;
      return undefined;
    });
  }
  return {
    ...deferred(evaluate),
    filter,
    find,
    map<U>(transform: (item: T) => U | Promise<U>) {
      return query(async function* () {
        for await (const item of source()) yield await transform(item);
      });
    },
    groupBy<K>(keyOf: (item: T) => K | Promise<K>) {
      return objectQuery(async () => {
        const result: Record<PropertyKey, T[]> = {};
        for await (const item of source()) {
          // Computed property keys use ToPropertyKey (including symbol wrappers).
          const key = Reflect.ownKeys({
            [(await keyOf(item)) as PropertyKey]: true,
          })[0]!;
          if (Object.hasOwn(result, key)) result[key]!.push(item);
          else
            Object.defineProperty(result, key, {
              value: [item],
              writable: true,
              enumerable: true,
              configurable: true,
            });
        }
        return result;
      });
    },
    toArray() {
      return query(async function* () {
        yield* await collect(source());
      });
    },
  };
}
function objectQuery<V>(
  evaluate: () => Promise<Record<PropertyKey, V>>,
): ObjectQuery<V> {
  const source = async function* () {
    yield* Object.values(await evaluate());
  };
  return {
    ...collection(source, evaluate),
    mapValues<U>(transform: (value: V, key: string) => U | Promise<U>) {
      return objectQuery(async () => {
        const result: Record<PropertyKey, U> = {};
        for (const [key, value] of Object.entries(await evaluate()))
          Object.defineProperty(result, key, {
            value: await transform(value, key),
            writable: true,
            enumerable: true,
            configurable: true,
          });
        return result;
      });
    },
    values() {
      return query(source);
    },
  };
}
export function query<T>(source: () => AsyncIterable<T>): AsyncQuery<T> {
  return collection(source, () => collect(source()));
}
