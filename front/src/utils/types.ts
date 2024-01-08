export type Optional<T, K extends keyof T> = T extends any
  ? any
  : Pick<Partial<T>, K> & Omit<T, K>;

export type PickNonOptional<T, K> = K extends keyof T
  ? undefined extends T[K]
    ? never
    : K
  : never;

export type NonOptional<T> = { [K in PickNonOptional<T, keyof T>]: T[K] };

export type NumberOrEmptyString<T> = {
  [K in keyof T]: T[K] extends number ? T[K] | "" : T[K];
};

//! use to type indexedDB types
export type Update<
  Key extends number | string,
  T extends { id: Key; updatedAt: number },
> = T | { id: Key; deleted: true; updatedAt: number };

export function objectIsDeleted<
  Key extends number | string,
  T extends { id: Key; updatedAt: number },
>(o: Update<Key, T>): o is { id: Key; deleted: true; updatedAt: number } {
  return "deleted" in o;
}
