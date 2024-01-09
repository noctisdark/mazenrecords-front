import { useState } from "react";

type LocalStorageResult<T> = {
  value: T;
  set: (newValue: NonNullable<T>) => void;
  clear: () => void;
};

export function useLocalStorage<T>(
  key: string,
  options: {
    serialize?: (t: T) => string;
    deserialize?: (t: string) => T;
  },
): LocalStorageResult<T | null>;

export function useLocalStorage<T>(
  key: string,
  options: {
    defaultValue: T;
    serialize?: (t: T) => string;
    deserialize?: (t: string) => T;
  },
): LocalStorageResult<T>;

export function useLocalStorage<T>(
  key: string,
  {
    defaultValue = undefined,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  }: {
    defaultValue?: T;
    serialize?: (t: T) => string;
    deserialize?: (t: string) => T;
  } = {},
) {
  const [value, setValue] = useState(() => {
    let itemValue = localStorage.getItem(key);
    //! Lose equality => undefined == null
    if (itemValue === null && defaultValue != undefined) {
      localStorage.setItem(key, serialize(defaultValue));
      return defaultValue;
    }

    return itemValue ? deserialize(itemValue) : null;
  });

  return {
    value,
    clear() {
      localStorage.removeItem(key);
      setValue(null);
    },
    set(value: T) {
      localStorage.setItem(key, serialize(value));
      setValue(value);
    },
  };
}
