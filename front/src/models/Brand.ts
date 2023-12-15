import * as Papa from "papaparse";

export type Model = string;

export type Brand = {
  id: number;
  name: string;
  models: Model[];
};

export const serializeBrand = (
  brand: Brand,
): { [key in keyof Brand]: string | number | string[] | number[] } => {
  return {
    ...brand,
    models: `${brand.models.join("|")}`,
  };
};

export const toCSV = (array: Brand[]): string => {
  const serializedVisits = array.map((visit) => serializeBrand(visit));
  return Papa.unparse(serializedVisits);
};

export const deserializeFields = (brand: {
  [key in keyof Brand]: string | number | string[] | number[];
}): Brand => {
  return {
    ...brand,
    models: (brand.models as string).split("|"),
  } as Brand;
};

export const parseCSV = (csv: string): Brand[] => {
  if (!csv) return [];
  const { data, errors, meta } = Papa.parse(csv, {
    header: true,
    dynamicTyping: true,
  });
  if (meta.aborted || errors.length) throw "Cannot parse CSV";
  return data.map(deserializeFields);
};

type BrandWithSetModels = {
  id: number;
  name: string;
  models: Set<Model>;
};

export const computeUpdates = (
  savedBrands: Brand[],
  uploadedBrands: Brand[],
) => {
  // merge by name

  const reverseMap: { [key: string]: BrandWithSetModels } = {};
  for (const savedBrand of savedBrands)
    reverseMap[savedBrand.id] = {
      ...savedBrand,
      models: new Set(savedBrand.models),
    };

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
    updatedBrands: Object.values(reverseMap).map((brand) => ({
      ...brand,
      models: [...brand.models],
    })),
  };
};
