import { AxiosResponse } from "axios";

import { Brand, JSONToBrand, brandToJSON } from "@/models/Brand";
import { Update } from "@/utils/types";

import api from ".";

const unwrapBrand = (
  response: Promise<AxiosResponse>,
): Promise<Update<string, Brand>> =>
  response.then((r) => JSONToBrand(r.data.brand));

export const getBrand = ({ id }: { id: Brand["id"] }) =>
  unwrapBrand(api.get(`/brands/${id}`));

export const createBrand = ({ brand }: { brand: Brand }) =>
  unwrapBrand(
    api.post("/brands", { brand: brandToJSON(brand) }),
  ) as Promise<Brand>;

/**
 * This is actually an upsert method
 */
export const updateBrand = ({ brand }: { brand: Brand }) =>
  unwrapBrand(
    api.patch("/brands", { brand: brandToJSON(brand) }),
  ) as Promise<Brand>;

/**
 * Soft delete on server
 */
export const deleteBrand = ({ id }: { id: Brand["id"] }) =>
  api.delete(`/brands/${id}`).then((r) => r.data.timestamp); // lose the result
