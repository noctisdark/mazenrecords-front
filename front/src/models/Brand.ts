import * as Papa from "papaparse";

export type Model = string;

export type Brand = {
  id: number;
  name: string;
  models: Set<Model>;
  updatedAt?: number;
  deleted?: boolean;
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

export const brandToJSON = (brand: Brand) => ({
  ...brand,
  models: [...brand.models],
});

export const JSONToBrand = (brand: any): Brand => ({
  ...brand,
  models: new Set(brand.models),
});

export const computeUpdates = (
  savedBrands: Brand[],
  uploadedBrands: Brand[],
) => {
  const reverseMap: { [key: string]: Brand } = {};
  for (const savedBrand of savedBrands)
    reverseMap[savedBrand.id] = savedBrand;

  for (const uploadedBrand of uploadedBrands) {
    if (reverseMap[uploadedBrand.name]) {
      for (const uploadedModel of uploadedBrand.models)
        reverseMap[uploadedBrand.name].models.add(uploadedModel);
    } else {
      reverseMap[uploadedBrand.name] = {
        id: uploadedBrand.id,
        name: uploadedBrand.name,
        models: new Set(uploadedBrand.models),
      };
    }
  }

  return {
    updatedBrands: Object.values(reverseMap),
  };
};
