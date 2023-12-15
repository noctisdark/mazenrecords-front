export const promisfyIDBRequest = <T>(req: IDBRequest<T>) => {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
};
