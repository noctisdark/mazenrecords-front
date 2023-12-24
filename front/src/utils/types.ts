export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type PickNonOptional<T, K> = K extends keyof T
  ? undefined extends T[K]
    ? never
    : K
  : never;

export type NonOptional<T> = { [K in PickNonOptional<T, keyof T>]: T[K] };

export type NumberOrEmptyString<T> = {
  [K in keyof T]: T[K] extends number ? T[K] | "" : T[K];
};
