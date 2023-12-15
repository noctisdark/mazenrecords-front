import * as Papa from "papaparse";
import * as z from "zod";

export type Visit = {
  id: number;
  date: Date;
  client: string;
  contact: string;
  brand: string;
  model: string;
  problem: string;
  fix: string;
  amount: number | "";
  updatedAt: Date;
};

export const VisitSchema = z.object({
  id: z.number({ required_error: "Reference number is required" }),
  date: z
    .date({ required_error: "Date of visit is required" })
    .default(new Date()),
  client: z.string({ required_error: "Client's name is required" }).min(4),
  contact: z.string({ required_error: "Client's contact is required" }).min(4),
  brand: z.string().min(1).default(""),
  model: z.string().min(1).default(""),
  problem: z.optional(z.string()).default(""),
  fix: z.optional(z.string()).default(""),
  amount: z.number().default(0),
});

export function createVisitForm(visitOrNextId: Visit | number): Visit {
  return typeof visitOrNextId === "number"
    ? {
        id: visitOrNextId,
        date: new Date(),
        client: "",
        contact: "",
        brand: "",
        model: "",
        problem: "",
        fix: "",
        amount: "",
        updatedAt: new Date(),
      }
    : { ...visitOrNextId, updatedAt: new Date() };
}

export const serializeVisit = (
  visit: Visit,
): { [key in keyof Visit]: string | number | string[] | number[] } => {
  return {
    ...visit,
    date: +visit.date,
    updatedAt: +visit.updatedAt,
  };
};

export const toCSV = (array: Visit[]): string => {
  const serializedVisits = array.map((visit) => serializeVisit(visit));
  return Papa.unparse(serializedVisits);
};

export const deserializeFields = (visit: {
  [key in keyof Visit]: string | number | string[] | number[];
}): Visit => {
  return {
    ...visit,
    date: new Date(visit.date as number),
    updatedAt: new Date(visit.updatedAt as number),
    contact: visit.contact.toString(), // maybe not written as string
  } as Visit;
};

export const parseCSV = (csv: string): Visit[] => {
  if (!csv) return [];
  const { data, errors, meta } = Papa.parse(csv, {
    header: true,
    dynamicTyping: true,
  });
  if (meta.aborted || errors.length) throw "Cannot parse CSV";
  // use ref as ID
  return data
    .map(({ ref, ...item }) => ({ ...item, id: ref ?? item.id }))
    .map(deserializeFields);
};

export const computeUpdates = (
  savedVisits: Visit[],
  uploadedVisits: Visit[],
) => {
  const reverseMap: { [key: number]: Visit } = {};
  const diffMap: { [key: number]: Visit } = {};
  for (const savedVisit of savedVisits) reverseMap[savedVisit.id] = savedVisit;

  let newVisits = 0,
    appliedUpdates = 0,
    ignoredUpdates = 0;

  for (const uploadedVisit of uploadedVisits) {
    if (!reverseMap[uploadedVisit.id]) {
      reverseMap[uploadedVisit.id] = uploadedVisit;
      diffMap[uploadedVisit.id] = uploadedVisit;
      newVisits++;
    } else if (
      uploadedVisit.updatedAt > reverseMap[uploadedVisit.id].updatedAt
    ) {
      reverseMap[uploadedVisit.id] = uploadedVisit;
      diffMap[uploadedVisit.id] = uploadedVisit;
      appliedUpdates++;
    } else {
      ignoredUpdates++;
    }
  }

  const updatedVisits = Object.values(diffMap);

  return {
    newVisits,
    appliedUpdates,
    ignoredUpdates,
    updatedVisits,
  };
};
