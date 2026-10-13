import { filter as filterItems } from "./filter.js";
import { map as mapItems } from "./map.js";
import { find as findItem } from "./find.js";
import { groupBy } from "./group-by.js";
import { mapValues } from "./map-values.js";
import { toArray } from "./to-array.js";

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
    return query(() => filterItems(source(), predicate));
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
    return deferred(() => findItem(source(), predicate));
  }
  return {
    ...deferred(evaluate),
    filter,
    find,
    map<U>(transform: (item: T) => U | Promise<U>) {
      return query(() => mapItems(source(), transform));
    },
    groupBy<K>(keyOf: (item: T) => K | Promise<K>) {
      return objectQuery(() => groupBy(source(), keyOf));
    },
    toArray() {
      return query(async function* () {
        yield* await toArray(source());
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
      return objectQuery(async () => mapValues(await evaluate(), transform));
    },
    values() {
      return query(source);
    },
  };
}
export function query<T>(source: () => AsyncIterable<T>): AsyncQuery<T> {
  return collection(source, () => toArray(source()));
}
