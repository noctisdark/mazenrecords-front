import { createContext, useContext } from "react";

import indexedDBImplementation from "@/utils/IndexedDB";

type IndexedDBContextType<
  Key extends IDBValidKey = number,
  T extends { id: Key } = any,
> = {
  dbReady: boolean;
  appDB: React.MutableRefObject<IDBDatabase>;

  add: (request: {
    storeName: string;
    key?: Key;
    data?: T;
    transaction?: IDBTransaction;
  }) => Promise<T>;

  upsert: (request: {
    storeName: string;
    key?: Key;
    data?: T;
    transaction?: IDBTransaction;
  }) => Promise<T>;

  remove: (request: {
    storeName: string;
    key: Key;
    transaction?: IDBTransaction;
  }) => Promise<Key>;

  softRemove: (request: {
    storeName: string;
    key: Key;
    timestamp: number;
    transaction?: IDBTransaction;
  }) => Promise<Key>;

  getById: (request: {
    storeName: string;
    id: Key;
    transaction?: IDBTransaction;
  }) => Promise<T>;

  getAllKeys: (request: {
    storeName: string;
    id: Key;
    count?: number;
    transaction?: IDBTransaction;
  }) => Promise<Key[]>;

  getAll: (request: {
    storeName: string;
    index?: string;
    count?: number;
    range?: IDBKeyRange;
    transaction?: IDBTransaction;
  }) => Promise<T[]>;

  clear: (request: { storeName: string; transaction?: IDBTransaction }) => Promise<void>;

  createTransaction: (transactionOptions: {
    storeNames: string | string[];
    mode?: IDBTransactionMode;
    options?: IDBTransactionOptions;
  }) => IDBTransaction;

  transaction: (
    transactionOptions: {
      storeNames: string | string[];
      mode?: IDBTransactionMode;
      options?: IDBTransactionOptions;
    },
    transactionScope: (transaction: IDBTransaction) => void,
  ) => Promise<void>;
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
  Key extends IDBValidKey = number,
  T extends { id: Key } = any,
>(): IndexedDBContextType<Key, T> {
  const context = useContext(IndexedDBContext);

  if (context === undefined)
    throw new Error("useIndexedDB must be used within a IndexedDBProvider");

  return context as IndexedDBContextType<Key, T>;
}

export default IndexedDBProvider;
