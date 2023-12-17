import { createContext, useContext, useEffect, useState } from "react";

import { Visit } from "@/models/Visit";
import {
  appendSorted,
  defaultSorting,
  moveId,
  removeById,
  replaceById,
  upsertById,
} from "@/utils/array";
import { binarySearch } from "@/utils/binary";
import { Optional } from "@/utils/types";

import { useIndexedDB } from "./IndexedDBProvider";

type VisitsContextType = {
  loading: boolean;
  error?: Error;
  visits: Visit[];
  nextId: number;
  hasId: (id: number) => boolean;
  getAll: (count?: number) => Promise<Visit[]>;
  getById: (id: number) => Promise<Visit>;
  add: (
    idOrData: Optional<Visit, "id"> | number,
    data?: Visit,
  ) => Promise<Visit>;
  replace: (idOrData: Visit | number, data?: Visit) => Promise<Visit>;
  upsert: (idOrData: Visit | number, data?: Visit) => Promise<Visit>;
  move: (
    oldKey: number,
    idOrData: Visit | number,
    data?: Visit,
  ) => Promise<Visit>;
  upsertBatch: (visits: Visit[]) => Promise<Visit[]>;
  remove: (key: number) => Promise<number>;
};

const VisitsContext = createContext({});

const VisitsProvider = ({ children }) => {
  const { dbReady, getAll, getById, add, move, upsert, remove } =
    useIndexedDB<Visit>();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>(true);

  // use Cursor, we might
  const nextId = (visits.at(-1)?.id ?? 0) + 1;
  const hasId = (id: number) =>
    binarySearch<{ id: number }>(visits, { id }, defaultSorting) > -1;

  const visitsContext: VisitsContextType = {
    error,
    loading,
    visits,
    nextId,
    hasId,
    getAll: (count?: number) => getAll("visits", count),
    getById: (id: number) => getById("visits", id),
    add: async (idOrData: Optional<Visit, "id"> | number, data?: Visit) => {
      const result = await add("visits", idOrData, data);
      // TODO: handle error
      setVisits(appendSorted(visits, result));
      return result;
    },
    move: async (oldId: number, idOrData: Visit | number, data?: Visit) => {
      const result = await move("visits", oldId, idOrData, data);
      // TODO: handle error
      setVisits(moveId(visits, oldId, result));
      return result;
    },
    replace: async (idOrData: Visit | number, data?: Visit) => {
      const result = await upsert("visits", idOrData, data);
      // TODO: handle error
      setVisits(replaceById(visits, result));
      return result;
    },
    upsert: async (idOrData: Visit | number, data?: Visit) => {
      const result = await upsert("visits", idOrData, data);
      // TODO: handle error
      setVisits(upsertById(visits, result, appendSorted));
      return result;
    },
    upsertBatch: async (newData) => {
      const newVisits = await Promise.all(
        newData.map((visit) => upsert("visits", visit)),
      );
      let updatedVisits = visits;

      // keep sorted
      for (const item of newVisits)
        updatedVisits = upsertById(updatedVisits, item, appendSorted);

      setVisits(updatedVisits);
      return newVisits;
    },
    remove: async (id: number) => {
      const removedId = await remove("visits", id);
      // TODO: handle error
      setVisits(removeById(visits, removedId));
      return removedId;
    },
  };

  useEffect(() => {
    (async () => {
      if (dbReady) {
        try {
          const visits = await visitsContext.getAll();
          visits.sort(defaultSorting);
          // O(n log n), can O(n) by getAll with cursor
          setVisits(visits);
        } catch (e) {
          setError(e as Error);
        } finally {
          setLoading(false);
        }
      }
    })();
    // visitsContext changes by reference but is semantically the same
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady]);

  return (
    <VisitsContext.Provider value={visitsContext}>
      {children}
    </VisitsContext.Provider>
  );
};

export function useVisits(): VisitsContextType {
  const context = useContext(VisitsContext);

  if (context === undefined)
    throw new Error("useVisits must be used within a VisitsProvider");

  return context as VisitsContextType;
}
export default VisitsProvider;
