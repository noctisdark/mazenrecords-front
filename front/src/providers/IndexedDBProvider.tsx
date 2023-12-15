import { createContext, useContext } from "react";

import indexedDBImplementation from "@/IndexedDB";
import { Optional } from "@/utils/types";

// use IndexedDB
useIndexedDB;

type IndexedDBContextType<T extends { id: number }, Key = number> = {
  dbReady: boolean;
  appDB: React.MutableRefObject<IDBDatabase>;
  add: (
    storeName: string,
    keyOrData: Key | Optional<T, "id">,
    data?: T,
  ) => Promise<T>;
  upsert: (storeName: string, keyOrData: Key | T, data?: T) => Promise<T>;
  remove: (storeName: string, key: Key) => Promise<Key>;
  move: (
    storeName: string,
    oldKey: Key,
    keyOrData: Key | T,
    data?: T,
  ) => Promise<T>;
  getById: (storeName: string, id: Key) => Promise<T>;
  getAllKeys: (storeName: string, id: number, count?: number) => Promise<Key[]>;
  getAll: (storeName: string, count?: number) => Promise<T[]>;
};

const IndexedDBContext = createContext({});

const IndexedDBProvider = ({ children }) => {
  return (
    <IndexedDBContext.Provider value={indexedDBImplementation()}>
      {children}
    </IndexedDBContext.Provider>
  );
};

export function useIndexedDB<
  T extends { id: number },
  Key = number,
>(): IndexedDBContextType<T, Key> {
  const context = useContext(IndexedDBContext);

  if (context === undefined)
    throw new Error("useIndexedDB must be used within a IndexedDBProvider");

  return context as IndexedDBContextType<T, Key>;
}

export default IndexedDBProvider;
