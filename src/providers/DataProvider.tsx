import { AlertCircle, Check, Loader2 } from "lucide-react";
import { createContext, useContext, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { createBrand, deleteBrand, updateBrand } from "@/api/brands";
import { getUpdatesSince, sync, upload as uploadRecords } from "@/api/updates";
import { createVisit, deleteVisit, updateVisit } from "@/api/visits";
import LoadingOverlay from "@/components/basics/LoadingOverlay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Brand, Model } from "@/models/Brand";
import { Visit } from "@/models/Visit";
import {
  append,
  appendSorted,
  defaultSorting,
  findByIdSorted,
  mergeUpdates,
  moveIdSorted,
  removeById,
  replaceById,
  upsertById,
  upsertByIdSorted,
} from "@/utils/array";
import { useEffectOnce } from "@/utils/hacks";
import { useLocalStorage } from "@/utils/localStorage";
import { objectIsDeleted } from "@/utils/types";

import { useAuth } from "./AuthProvider";
import { useIndexedDB } from "./IndexedDBProvider";

//! Careful: maybe we need to use PUT instead of ADD because of the deleted records in offline mode

//TODO: refactor this shitty file
type Progress = { description: string; progress?: number; done?: boolean };
type RefreshOptions = {
  fromZero?: boolean;
  showLoading?: boolean;
  onProgress?: (progress: Progress) => void;
};

type DataContextType = {
  loading: boolean;
  error?: Error;
  refresh: () => void;
  upload: ({
    visits,
    brands,
  }: {
    visits: Visit[];
    brands: Brand[];
  }) => Promise<{ visits: Visit[]; brands: Brand[] }>;

  visits: Visit[];
  addVisit: (visit: Visit) => Promise<Visit>;
  replaceVisit: (visit: Visit) => Promise<Visit>;
  upsertVisit: (visit: Visit) => Promise<Visit>;
  removeVisit: (key: number) => Promise<number>;
  moveVisit: (oldId: number, visit: Visit) => Promise<Visit>;
  hasVisit: (id: number) => boolean;
  nextVisitId: number;

  brands: Brand[];
  addBrand: (brand: Omit<Brand, "id">) => Promise<Brand>;
  upsertBrand: (brand: Brand) => Promise<Brand>;
  addModel: (brand: Brand, model: Model) => Promise<Brand>;
  removeBrand: (key: string) => Promise<string>;
};

const DataContext = createContext({});

const DataProvider = ({ children }) => {
  const { toast } = useToast();
  const { offlineMode, isOffline } = useAuth();
  const { dbReady, getAll, add, upsert, remove, softRemove, transaction } = useIndexedDB<
    string | number
  >();

  const isFirstRender = useRef(true);

  const { value: epoch, set: setLastEpoch } = useLocalStorage<number>("epoch", {
    defaultValue: 0,
  });

  /**
   * Sorted
   */
  const [visits, setVisits] = useState<Visit[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>(!dbReady);

  const refresh = async ({
    fromZero = false,
    showLoading = false,
    onProgress,
  }: RefreshOptions = {}) => {
    try {
      if (showLoading) setLoading(true);

      let visits: Visit[] = [],
        brands: Brand[] = [];

      if (isOffline) {
        const [localVisits, localBrands] = await Promise.all([
          getAll({ storeName: "visits" }) as Promise<Visit[]>,
          getAll({ storeName: "brands" }) as Promise<Brand[]>,
        ]);

        onProgress?.({ description: "Complete", done: true });

        visits = localVisits
          .filter((visit) => !objectIsDeleted(visit))
          .sort(defaultSorting);
        brands = localBrands.filter((brand) => !objectIsDeleted(brand));
      } else {
        const [localVisitsUpdates, localBrandsUpdates] = await Promise.all([
          getAll({
            storeName: "visits",
            index: "updatedAt",
            range: IDBKeyRange.lowerBound(epoch, true),
          }) as Promise<Visit[]>,
          getAll({
            storeName: "brands",
            index: "updatedAt",
            range: IDBKeyRange.lowerBound(epoch, true),
          }) as Promise<Brand[]>,
        ]);

        let newEpoch = fromZero ? 0 : epoch;

        onProgress?.({ description: "Retrieving server updates..." });
        const { visits: upstreamVisitsUpdates, brands: upstreamBrandsUpdates } =
          await getUpdatesSince({ epoch: newEpoch });

        const {
          newEpoch: brandsNewEpoch,
          upstreamUpserts: upstreamVisitsUpserts,
          localUpserts: localVisitsUpserts,
          upstreamDeletes: upstreamVisitsDeletes,
          localDeletes: localVisitsDeletes,
        } = mergeUpdates(epoch, localVisitsUpdates, upstreamVisitsUpdates);

        const {
          newEpoch: visitsNewEpoch,
          upstreamUpserts: upstreamBrandsUpserts,
          localUpserts: localBrandsUpserts,
          upstreamDeletes: upstreamBrandsDeletes,
          localDeletes: localBrandsDeletes,
        } = mergeUpdates(epoch, localBrandsUpdates, upstreamBrandsUpdates);

        const localTotal =
          localVisitsDeletes.length +
          localBrandsDeletes.length +
          localVisitsUpserts.length +
          localBrandsUpserts.length;

        if (localTotal) {
          // resolve local changes
          onProgress?.({ description: "Applying server updates..." });
          await transaction(
            { storeNames: ["visits", "brands"], mode: "readwrite" },
            (transaction) => {
              localVisitsDeletes.forEach((visitId) =>
                remove({ transaction, storeName: "visits", key: visitId }),
              );
              localBrandsDeletes.forEach((brandId) =>
                remove({ transaction, storeName: "brands", key: brandId }),
              );
              localVisitsUpserts.forEach((visit) =>
                upsert({ transaction, storeName: "visits", data: visit }),
              );
              localBrandsUpserts.forEach((brand) =>
                upsert({ transaction, storeName: "brands", data: brand }),
              );
            },
          );
        }

        newEpoch = Math.max(visitsNewEpoch, brandsNewEpoch);

        // resolve upstream changes
        let updateCount =
          upstreamVisitsDeletes.length +
          upstreamBrandsDeletes.length +
          upstreamVisitsUpserts.length +
          upstreamBrandsUpserts.length;

        if (updateCount) {
          onProgress?.({
            description: "Saving local updates...",
          });

          const {
            timestamp,
            visits: newVisits,
            brands: newBrands,
          } = await sync({
            visitDeletes: upstreamVisitsDeletes as number[],
            brandDeletes: upstreamBrandsDeletes as string[],
            visitUpserts: upstreamVisitsUpserts,
            brandUpserts: upstreamBrandsUpserts,
          });

          await transaction(
            { storeNames: ["visits", "brands"], mode: "readwrite" },
            (transaction) => {
              upstreamVisitsDeletes.forEach((visitId) =>
                remove({ transaction, storeName: "visits", key: visitId }),
              );
              newVisits.forEach((visit) =>
                upsert({ transaction, storeName: "visits", data: visit }),
              );
              upstreamBrandsDeletes.forEach((brandId) =>
                remove({ transaction, storeName: "brands", key: brandId }),
              );
              newBrands.forEach((brand) =>
                upsert({ transaction, storeName: "brands", data: brand }),
              );
            },
          );

          newEpoch = Math.max(newEpoch, timestamp);
        }

        setLastEpoch(newEpoch);

        // reload the visits
        onProgress?.({ description: "Complete", done: true });

        const [localVisits, localBrands] = await Promise.all([
          getAll({ storeName: "visits" }) as Promise<Visit[]>,
          getAll({ storeName: "brands" }) as Promise<Brand[]>,
        ]);

        visits = localVisits
          .filter((visit) => !objectIsDeleted(visit))
          .sort(defaultSorting);

        brands = localBrands.filter((brand) => !objectIsDeleted(brand));
      }

      // merge here and get new epoch
      setVisits(visits);
      setBrands(brands);
    } catch (error) {
      setError(error as Error);
      toast({
        variant: "destructive",
        title: "Error loading updates",
        description: String(error),
      });
    } finally {
      setLoading(false);
      isFirstRender.current = false;
    }
  };

  const refreshWithProgress = ({
    showLoading = true,
    fromZero = false,
  }: RefreshOptions = {}) => {
    const t = toast({ duration: Infinity });

    refresh({
      fromZero,
      showLoading,
      onProgress: ({ description, done }) => {
        t.update({
          id: t.id,
          description,
          title: (
            <div className="flex gap-x-2 items-center">
              {isOffline ? "Offline Mode" : "Synchronizing"}
              {done ? <Check /> : <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
          ),
          duration: done ? 2000 : Infinity,
        });
      },
    });
  };

  useEffectOnce(() => {
    if (!dbReady) return;
    if (offlineMode || !isOffline)
      refreshWithProgress({ showLoading: isFirstRender.current });
  }, [dbReady, isOffline, offlineMode]);

  const hasVisit = (id: number) => findByIdSorted(visits, id) >= 0;
  const nextVisitId = +(visits.at(-1)?.id ?? 0) + 1;

  const addVisit = async (visit: Visit) => {
    let newVisit: Visit;
    if (isOffline) {
      const timestamp = +new Date();
      newVisit = { ...visit, updatedAt: timestamp };
      await add({ storeName: "visits", data: newVisit });
    } else {
      newVisit = await createVisit({ visit });
      await add({ storeName: "visits", data: newVisit });
      setLastEpoch(newVisit.updatedAt!);
    }

    setVisits((visits) => appendSorted(visits, newVisit));
    return newVisit;
  };

  const replaceVisit = async (visit: Visit) => {
    let newVisit: Visit;
    if (isOffline) {
      const timestamp = +new Date();
      newVisit = { ...visit, updatedAt: timestamp };
      await upsert({ storeName: "visits", data: newVisit });
    } else {
      newVisit = await updateVisit({ visit });
      await upsert({ storeName: "visits", data: newVisit });
      setLastEpoch(newVisit.updatedAt!);
    }

    setVisits((visits) => replaceById(visits, newVisit));
    return newVisit;
  };

  const upsertVisit = async (visit: Visit) => {
    let newVisit: Visit;
    if (isOffline) {
      const timestamp = +new Date();
      newVisit = { ...visit, updatedAt: timestamp };
      await upsert({ storeName: "visits", data: newVisit });
    } else {
      newVisit = await updateVisit({ visit });
      await upsert({ storeName: "visits", data: newVisit });
      setLastEpoch(newVisit.updatedAt!);
    }

    setVisits((visits) => upsertByIdSorted(visits, newVisit));
    return newVisit;
  };

  const moveVisit = async (oldId: number, visit: Visit) => {
    let newVisit: Visit;

    if (isOffline) {
      const timestamp = +new Date();
      newVisit = { ...visit, updatedAt: timestamp };

      await transaction({ storeNames: ["visits"], mode: "readwrite" }, (transaction) => {
        softRemove({
          transaction,
          storeName: "visits",
          key: oldId,
          timestamp,
        });
        add({ transaction, storeName: "visits", data: newVisit });
      });
    } else {
      // TODO: replace with a transaction on the server
      [, newVisit] = await Promise.all([
        deleteVisit({ id: oldId }),
        createVisit({ visit }),
      ]);

      await transaction({ storeNames: ["visits"], mode: "readwrite" }, (transaction) => {
        remove({ transaction, storeName: "visits", key: oldId });
        add({ transaction, storeName: "visits", data: newVisit });
      });

      setLastEpoch(newVisit.updatedAt!);
    }

    setVisits((visits) => moveIdSorted(visits, oldId, newVisit));
    return newVisit;
  };

  const removeVisit = async (id: number) => {
    if (isOffline) {
      const timestamp = +new Date();
      await softRemove({
        storeName: "visits",
        key: id,
        timestamp,
      });
    } else {
      const timestamp = await deleteVisit({ id });
      await remove({
        storeName: "visits",
        key: id,
      });
      setLastEpoch(timestamp);
    }

    setVisits((visits) => removeById(visits, id));
    return id;
  };

  const upload = async ({
    visits: newVisits,
    brands: newBrands,
  }: {
    visits: Visit[];
    brands: Brand[];
  }) => {
    if (isOffline) {
      const timestamp = +new Date();
      // easier to make two transactions for now
      await transaction(
        { storeNames: ["visits", "brands"], mode: "readwrite" },
        (transaction) => {
          visits.forEach((visit) =>
            softRemove({
              transaction,
              storeName: "visits",
              key: visit.id,
              timestamp,
            }),
          );
          brands.forEach((brand) =>
            softRemove({
              transaction,
              storeName: "brands",
              key: brand.id,
              timestamp,
            }),
          );
        },
      );

      await transaction(
        { storeNames: ["visits", "brands"], mode: "readwrite" },
        (transaction) => {
          newVisits.forEach((visit) =>
            upsert({ transaction, storeName: "visits", data: visit }),
          );
          newBrands.forEach((brand) =>
            upsert({ transaction, storeName: "brands", data: brand }),
          );
        },
      );
      return { visits: newVisits, brands: newBrands };
    } else {
      const {
        timestamp,
        visits: updatedVisits,
        brands: updatedBrands,
      } = await uploadRecords({
        visits: newVisits,
        brands: newBrands,
      });

      // easier to make two transactions for now
      await transaction(
        { storeNames: ["visits", "brands"], mode: "readwrite" },
        (transaction) => {
          visits.forEach((visit) =>
            remove({ transaction, storeName: "visits", key: visit.id }),
          );
          brands.forEach((brand) =>
            remove({ transaction, storeName: "brands", key: brand.id }),
          );
        },
      );

      await transaction(
        { storeNames: ["visits", "brands"], mode: "readwrite" },
        (transaction) => {
          updatedVisits.forEach((visit) =>
            upsert({ transaction, storeName: "visits", data: visit }),
          );
          updatedBrands.forEach((brand) =>
            upsert({ transaction, storeName: "brands", data: brand }),
          );
        },
      );

      setVisits(updatedVisits);
      setBrands(updatedBrands);
      setLastEpoch(timestamp);
      return { visits: updatedVisits, brands: updatedBrands };
    }
  };

  const addBrand = async (brand: Omit<Brand, "id">) => {
    let candidateBrand: Brand = { ...brand, id: uuidv4() };
    let newBrand: Brand;

    if (isOffline) {
      const timestamp = +new Date();
      newBrand = { ...candidateBrand, updatedAt: timestamp };
      await add({ storeName: "brands", data: newBrand });
    } else {
      newBrand = await createBrand({ brand: candidateBrand });
      await add({ storeName: "brands", data: newBrand });
      setLastEpoch(newBrand.updatedAt!);
    }

    setBrands((brands) => append(brands, newBrand));
    return newBrand;
  };

  const upsertBrand = async (brand: Brand) => {
    let newBrand: Brand;
    if (isOffline) {
      const timestamp = +new Date();
      newBrand = { ...brand, updatedAt: timestamp };
      await upsert({ storeName: "brands", data: newBrand });
    } else {
      newBrand = await updateBrand({ brand });
      await upsert({ storeName: "brands", data: newBrand });
      setLastEpoch(newBrand.updatedAt!);
    }

    setBrands((brands) => upsertById(brands, newBrand));
    return newBrand;
  };

  const removeBrand = async (id: string) => {
    if (isOffline) {
      const timestamp = +new Date();

      await softRemove({
        storeName: "brands",
        key: id,
        timestamp,
      });
    } else {
      const timestamp = await deleteBrand({ id });
      await remove({
        storeName: "brands",
        key: id,
      });
      setLastEpoch(timestamp);
    }

    setBrands((brands) => removeById(brands, id));
    return id;
  };

  const addModel = (brand: Brand, model: Model) =>
    upsertBrand({ ...brand, models: new Set(brand.models).add(model) });

  const dataContext: DataContextType = {
    visits,
    brands,
    loading,
    error,
    refresh,
    upload,

    hasVisit,
    nextVisitId,
    addVisit,
    replaceVisit,
    upsertVisit,
    moveVisit,
    removeVisit,

    addBrand,
    upsertBrand,
    removeBrand,
    addModel,
  };

  if (loading) return <LoadingOverlay className="h-10 w-10" />;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Error loading data</AlertTitle>
        <AlertDescription>Error while loading data {error.toString()}.</AlertDescription>
      </Alert>
    );

  return <DataContext.Provider value={dataContext}>{children}</DataContext.Provider>;
};

export default DataProvider;

export function useData(): DataContextType {
  const context = useContext(DataContext);

  if (context === undefined)
    throw new Error("useData must be used within a DataProvider");

  return context as DataContextType;
}

type VisitsContextType = {
  visits: Visit[];
  add: (visit: Visit) => Promise<Visit>;
  replace: (visit: Visit) => Promise<Visit>;
  upsert: (visit: Visit) => Promise<Visit>;
  remove: (key: number) => Promise<number>;
  move: (oldId: number, visit: Visit) => Promise<Visit>;
  hasId: (id: number) => boolean;
  nextId: number;
};

export const useVisits = (): VisitsContextType => {
  const context = useData();

  if (context === undefined)
    throw new Error("useVisits must be used within a DataProvider");

  return {
    visits: context.visits,
    add: context.addVisit,
    replace: context.replaceVisit,
    upsert: context.upsertVisit,
    move: context.moveVisit,
    remove: context.removeVisit,
    hasId: context.hasVisit,
    nextId: context.nextVisitId,
  };
};

type BrandsContextType = {
  brands: Brand[];
  add: (brand: Omit<Brand, "id">) => Promise<Brand>;
  upsert: (brand: Brand) => Promise<Brand>;
  remove: (key: string) => Promise<string>;
  upsertModel: (brand: Brand, model: Model) => Promise<Brand>;
};

export const useBrands = (): BrandsContextType => {
  const context = useData();

  if (context === undefined)
    throw new Error("useBrands must be used within a DataProvider");

  return {
    brands: context.brands,
    add: context.addBrand,
    upsert: context.upsertBrand,
    remove: context.removeBrand,
    upsertModel: context.addModel,
  };
};
