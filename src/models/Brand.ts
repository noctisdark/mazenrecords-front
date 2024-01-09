import * as Papa from "papaparse";

import { Update, objectIsDeleted } from "@/utils/types";

export type Model = string;

export type Brand = {
  id: string;
  name: string;
  models: Set<Model>;
  updatedAt: number;
};

export type BrandForm = {
  name: string;
  models: Set<Model>;
};

export const brandToCSVRow = (
  brand: Brand,
): {
  [key in keyof Brand]: string | number | boolean | string[] | number[];
} => {
  return {
    ...brand,
    models: `${[...brand.models].join("|")}`,
    updatedAt: brand.updatedAt,
  };
};

export const toCSV = (array: Brand[]): string => {
  const serializedVisits = array.map((visit) => brandToCSVRow(visit));
  return Papa.unparse(serializedVisits);
};

export const CSVRowToBrand = (brand: {
  [key in keyof Brand]: string | number | string[] | number[];
}): Brand => {
  return {
    ...brand,
    models: new Set((brand.models as string).split("|")),
  } as Brand;
};

export const parseCSV = (csv: string): Brand[] => {
  if (!csv) return [];
  const { data, errors, meta } = Papa.parse(csv, {
    header: true,
    dynamicTyping: true,
  });
  if (meta.aborted || errors.length) throw "Cannot parse CSV";
  return data.map(CSVRowToBrand);
};

export const brandToJSON = (brand: Update<string, Brand>): any =>
  objectIsDeleted(brand)
    ? brand
    : {
        ...brand,
        models: [...brand.models],
      };

export const JSONToBrand = (brand: any): Update<string, Brand> =>
  objectIsDeleted(brand)
    ? brand
    : {
        ...brand,
        models: new Set(brand.models),
      };
