import { createContext, useContext, useEffect, useState } from "react";

import { Brand, Model } from "@/models/Brand";
import { append, upsertById } from "@/utils/array";
import { Optional } from "@/utils/types";

import { useIndexedDB } from "./IndexedDBProvider";

type BrandsContextType = {
  loading: boolean;
  error?: Error;
  brands: Brand[];
  getAll: (count?: number) => Promise<Brand[]>;
  add: (
    idOrData: Optional<Brand, "id"> | number,
    data?: Brand,
  ) => Promise<Brand>;
  upsert: (idOrData: Brand | number, data?: Brand) => Promise<Brand>;
  upsertModel: (brand: Brand, model: Model) => Promise<Brand>;
  upsertBatch: (brand: Brand[]) => Promise<Brand[]>;
};

const BrandsContext = createContext({});

const BrandsProvider = ({ children }) => {
  const { dbReady, getAll, add, upsert } = useIndexedDB<Brand>();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>(true);

  const brandsContext: BrandsContextType = {
    error,
    loading,
    brands,
    add: async (idOrData: Optional<Brand, "id"> | number, data?: Brand) => {
      const result = await add("brands", idOrData, data);
      // TODO: handle error
      setBrands(append(brands, result));
      return result;
    },
    upsert: async (idOrData: Brand | number, data?: Brand) => {
      const result = await upsert("brands", idOrData, data);
      // TODO: handle error
      setBrands(upsertById(brands, result));
      return result;
    },
    upsertModel: async (brand: Brand, model: Model) => {
      const result = await upsert("brands", {
        ...brand,
        // immutable update
        models: new Set(brand.models).add(model),
      });

      setBrands(upsertById(brands, result));
      return result;
    },
    getAll: (count?: number) => getAll("brands", count),
    upsertBatch: async (newData) => {
      const newBrands = await Promise.all(
        newData.map((visit) => upsert("brands", visit)),
      );
      let updatedBrands = brands;

      for (const item of newBrands)
        updatedBrands = upsertById(updatedBrands, item);

      setBrands(updatedBrands);
      return newBrands;
    },
  };

  useEffect(() => {
    (async () => {
      if (dbReady) {
        try {
          setBrands(await brandsContext.getAll());
        } catch (e) {
          setError(e as Error);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [dbReady]);

  return (
    <BrandsContext.Provider value={brandsContext}>
      {children}
    </BrandsContext.Provider>
  );
};

export function useBrands(): BrandsContextType {
  const context = useContext(BrandsContext);

  if (context === undefined)
    throw new Error("useBrands must be used within a BrandsProvider");

  return context as BrandsContextType;
}
export default BrandsProvider;
