import { useCallback, useEffect, useRef, useState } from "react";

// decouple from react

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
  const visitsTable = db.createObjectStore("visits", {
    keyPath: "id",
    autoIncrement: true,
  });

  visitsTable.createIndex("date", "date", { unique: false });
  visitsTable.createIndex("client", "client", { unique: false });
  visitsTable.createIndex("contact", "contact", { unique: false });
  visitsTable.createIndex("brand", "brand", { unique: false });
  visitsTable.createIndex("model", "model", { unique: false });
  visitsTable.createIndex("problem", "problem", { unique: false });
  visitsTable.createIndex("fix", "fix", { unique: false });
  visitsTable.createIndex("amount", "amount", { unique: false });
  visitsTable.createIndex("updatedAt", "updatedAt", { unique: false });

  const brandsTable = db.createObjectStore("brands", {
    keyPath: "id",
    autoIncrement: true,
  });

  brandsTable.createIndex("name", "name", { unique: false });
  brandsTable.createIndex("models", "models", { unique: false });
};

const useIndexedDB = () => {
  const [dbReady, setDbReady] = useState(false);
  const appDB = useRef<IDBDatabase>();

  useEffect(() => {
    (async () => {
      appDB.current = await openDB(
        "appStorage",
        1,
        (ev: IDBVersionChangeEvent) => {
          // Initialize DB
          const db: IDBDatabase = (ev as any).target.result;
          initDB(db);
          console.log("init done");
        },
      );

      setDbReady(true);
    })();
  }, []);

  const transaction = useCallback(
    (
      storeNames: string | string[],
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions,
    ) => {
      if (!appDB.current) throw new Error("DB Not Ready");
      return appDB.current.transaction(storeNames, mode, options);
    },
    [dbReady],
  );

  const add: <T, Key = number>(
    storeName: string,
    keyOrData: Key | T,
    data?: T,
  ) => Promise<T> = useCallback(
    (storeName: string, keyOrdata: any, data?: any) => {
      if (!appDB.current) throw new Error("DB Not Ready");
      return new Promise((resolve, reject) => {
        const writeTransaction: IDBTransaction = transaction(
          storeName,
          "readwrite",
        )!;
        writeTransaction.onerror = () => reject(writeTransaction.error);
        const store = writeTransaction.objectStore(storeName);
        let request = data ? store.add(data, keyOrdata) : store.add(keyOrdata);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const source = data || keyOrdata;
          resolve({ ...source, id: request.result });
        };
      });
    },
    [dbReady],
  );

  const upsert: <T, Key = number>(
    storeName: string,
    keyOrData: Key | T,
    data?: T,
  ) => Promise<T> = useCallback(
    (storeName: string, keyOrdata: any, data?: any) => {
      if (!appDB.current) throw new Error("DB Not Ready");
      return new Promise((resolve, reject) => {
        const writeTransaction: IDBTransaction = transaction(
          storeName,
          "readwrite",
        )!;
        writeTransaction.onerror = () => reject(writeTransaction.error);
        const store = writeTransaction.objectStore(storeName);
        let request = data ? store.put(data, keyOrdata) : store.put(keyOrdata);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const source = data || keyOrdata;
          resolve({ ...source, id: request.result });
        };
      });
    },
    [dbReady],
  );

  const remove: <Key = number>(storeName: string, key: Key) => Promise<Key> =
    useCallback(
      (storeName: string, key: any) => {
        if (!appDB.current) throw new Error("DB Not Ready");
        return new Promise((resolve, reject) => {
          const writeTransaction: IDBTransaction = transaction(
            storeName,
            "readwrite",
          )!;
          writeTransaction.onerror = () => reject(writeTransaction.error);
          const store = writeTransaction.objectStore(storeName);
          let request = store.delete(key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(key);
        });
      },
      [dbReady],
    );

  const move: <T, Key = number>(
    storeName: string,
    oldKey: Key,
    keyOrData: Key | T,
    data?: T,
  ) => Promise<T> = useCallback(
    (storeName: string, oldKey: any, keyOrdata: any, data?: any) => {
      if (!appDB.current) throw new Error("DB Not Ready");
      return new Promise((resolve, reject) => {
        const writeTransaction: IDBTransaction = transaction(
          storeName,
          "readwrite",
        )!;
        writeTransaction.onerror = () => reject(writeTransaction.error);
        const store = writeTransaction.objectStore(storeName);
        const writeRequest = data
          ? store.add(data, keyOrdata)
          : store.add(keyOrdata);
        const deleteRequest = store.delete(oldKey);
        writeRequest.onerror = () => reject(writeRequest.error);
        deleteRequest.onerror = () => reject(deleteRequest.error);

        writeRequest.onsuccess = deleteRequest.onsuccess = () => {
          if (
            writeRequest.readyState === "done" &&
            deleteRequest.readyState === "done"
          ) {
            const source = data || keyOrdata;
            resolve({ ...source, id: writeRequest.result });
          }
        };
      });
    },
    [dbReady],
  );

  const getById: <T, Key = number>(storeName: string, id: Key) => Promise<T> =
    useCallback(
      (storeName: string, id: any) => {
        if (!appDB.current) throw new Error("DB Not Ready");
        return new Promise((resolve, reject) => {
          const readTransaction: IDBTransaction = transaction(
            storeName,
            "readonly",
          )!;
          readTransaction.onerror = () => reject(readTransaction.error);
          const store = readTransaction.objectStore(storeName);
          const request = store.get(id);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result as any);
        });
      },
      [dbReady],
    );

  const getAllKeys: <Key = number>(
    storeName: string,
    id: number,
    count?: number,
  ) => Promise<Key[]> = useCallback(
    (storeName: string, id: number, count?: number) => {
      if (!appDB.current) throw new Error("DB Not Ready");
      return new Promise((resolve, reject) => {
        const readTransaction: IDBTransaction = transaction(
          storeName,
          "readonly",
        )!;
        readTransaction.onerror = () => reject(readTransaction.error);
        const store = readTransaction.objectStore(storeName);
        const request = store.getAllKeys(id, count);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as any);
      });
    },
    [dbReady],
  );

  const getAll: <T>(storeName: string, count?: number) => Promise<T[]> =
    useCallback(
      (storeName: string, count?: number) => {
        if (!appDB.current) throw new Error("DB Not Ready");
        return new Promise((resolve, reject) => {
          const readTransaction: IDBTransaction = transaction(
            storeName,
            "readonly",
          )!;
          readTransaction.onerror = () => reject(readTransaction.error);
          const store = readTransaction.objectStore(storeName);
          const request = store.getAll(null, count);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result as any);
        });
      },
      [dbReady],
    );

  const _getIndices: (storeName: string) => Promise<string[]> = useCallback(
    (storeName: string) =>
      new Promise((resolve, reject) => {
        const readTransaction: IDBTransaction = transaction(
          storeName,
          "readonly",
        )!;
        readTransaction.onerror = () => reject(readTransaction.error);
        const store = readTransaction.objectStore(storeName);
        return resolve([...store.indexNames]);
      }),
    [],
  );

  return {
    dbReady,
    appDB,
    add,
    upsert,
    remove,
    move,
    getById,
    getAllKeys,
    getAll,
    _getIndices,
    _transaction: transaction,
  };
};

export default useIndexedDB;
