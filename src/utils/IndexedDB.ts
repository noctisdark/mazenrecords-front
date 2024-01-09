import { useEffect, useRef, useState } from "react";

export const openDB = (
  name: string,
  version: number,
  runMigration?: (db: IDBVersionChangeEvent) => void,
): Promise<IDBDatabase> => {
  const openRequest = window.indexedDB.open(name, version);
  return new Promise((resolve, reject) => {
    openRequest.addEventListener("error", reject);
    openRequest.addEventListener("success", () => resolve(openRequest.result));
    runMigration && openRequest.addEventListener("upgradeneeded", runMigration);
  });
};

const initDB = (db: IDBDatabase) => {
  const visitsStore = db.createObjectStore("visits", {
    keyPath: "id",
    autoIncrement: true,
  });

  visitsStore.createIndex("updatedAt", "updatedAt", { unique: false });

  const brandsStore = db.createObjectStore("brands", {
    keyPath: "id",
  });

  brandsStore.createIndex("updatedAt", "updatedAt", { unique: false });
};

const useIndexedDB = () => {
  const [dbReady, setDbReady] = useState(false);
  const appDB = useRef<IDBDatabase>();

  useEffect(() => {
    (async () => {
      appDB.current = await openDB("appStorage", 1, (ev: IDBVersionChangeEvent) => {
        // Initialize DB
        const db: IDBDatabase = (ev as any).target.result;
        initDB(db);
      });

      setDbReady(true);
    })();
  }, []);

  const createTransaction = ({
    storeNames,
    mode,
    options,
  }: {
    storeNames: string | string[];
    mode?: IDBTransactionMode;
    options?: IDBTransactionOptions;
  }) => {
    if (!appDB.current) throw new Error("DB Not Ready");
    return appDB.current.transaction(storeNames, mode, options);
  };

  const add = <T, Key extends IDBValidKey = number>({
    storeName,
    key,
    data,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readwrite",
    }),
  }: {
    storeName: string;
    key?: Key;
    data?: T;
    transaction?: IDBTransaction;
  }): Promise<T> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const request = data ? store.add(data, key as IDBValidKey) : store.add(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const source = (data || key) as T;
        resolve({ ...source, id: request.result });
      };
    });
  };

  const upsert = <T, Key extends IDBValidKey = number>({
    storeName,
    key,
    data,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readwrite",
    }),
  }: {
    storeName: string;
    key?: Key;
    data?: T;
    transaction?: IDBTransaction;
  }): Promise<T> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const request = data ? store.put(data, key as IDBValidKey) : store.put(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const source = data || (key as T);
        resolve({ ...source, id: request.result });
      };
    });
  };

  const softRemove = <Key extends IDBValidKey = number>({
    storeName,
    key,
    timestamp,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readwrite",
    }),
  }: {
    storeName: string;
    key: Key;
    timestamp: number;
    transaction?: IDBTransaction;
  }) =>
    upsert({
      storeName,
      data: {
        id: key,
        updatedAt: timestamp,
        deleted: true,
      },
      transaction,
    });

  const remove = <Key extends IDBValidKey = number>({
    storeName,
    key,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readwrite",
    }),
  }: {
    storeName: string;
    key: Key;
    transaction?: IDBTransaction;
  }): Promise<Key> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(key);
    });
  };

  const getById = <T, Key extends IDBValidKey = number>({
    storeName,
    id,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readonly",
    }),
  }: {
    storeName: string;
    id: Key;
    transaction?: IDBTransaction;
  }): Promise<T> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as any);
    });
  };

  const getAllKeys = <Key extends IDBValidKey = number>({
    storeName,
    id,
    count,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readonly",
    }),
  }: {
    storeName: string;
    id: Key;
    count?: number;
    transaction?: IDBTransaction;
  }): Promise<Key[]> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys(id, count);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as any);
    });
  };

  const getAll = <T>({
    storeName,
    index,
    count,
    range = undefined,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readonly",
    }),
  }: {
    storeName: string;
    index?: string;
    range?: IDBKeyRange;
    count?: number;
    transaction?: IDBTransaction;
  }): Promise<T[]> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const target = index ? store.index(index) : store;
      const request = target.getAll(range, count);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as any);
    });
  };

  const clear = ({
    storeName,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readwrite",
    }),
  }: {
    storeName: string;
    transaction?: IDBTransaction;
  }): Promise<void> => {
    if (!appDB.current) return Promise.reject(new Error("DB Not Ready"));
    return new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  const _getIndices = ({
    storeName,
    transaction = createTransaction({
      storeNames: [storeName],
      mode: "readonly",
    }),
  }: {
    storeName: string;
    transaction?: IDBTransaction;
  }): Promise<string[]> =>
    new Promise((resolve, reject) => {
      transaction.addEventListener("error", () => reject(transaction.error));
      const store = transaction.objectStore(storeName);
      return resolve([...store.indexNames]);
    });

  const transaction = <T>(
    {
      storeNames,
      mode,
      options,
    }: {
      storeNames: string | string[];
      mode?: IDBTransactionMode;
      options?: IDBTransactionOptions;
    },
    transactionScope: (transaction: IDBTransaction) => T,
  ) =>
    new Promise((resolve, reject) => {
      const t = createTransaction({ storeNames, mode, options });
      t.addEventListener("error", reject);
      t.addEventListener("complete", () => resolve(undefined));
      transactionScope(t);
    });

  return {
    dbReady,
    appDB,
    add,
    upsert,
    remove,
    softRemove,
    getById,
    getAllKeys,
    getAll,
    createTransaction,
    transaction,
    clear,
    _getIndices,
  };
};

export default useIndexedDB;
