import * as Papa from "papaparse";
import * as z from "zod";

import { NumberOrEmptyString, Update } from "@/utils/types";

export type Visit = {
  id: number;
  date: number;
  client: string;
  contact: string;
  brand: string;
  model: string;
  problem: string;
  fix: string;
  amount: number;
  updatedAt: number;
};

export const VisitSchema = z.object({
  id: z.number({ required_error: "Reference number is required" }),
  date: z.date({ required_error: "Date of the visit is required" }).default(new Date()),
  client: z.string({ required_error: "Client's name is required" }).min(4),
  contact: z.string({ required_error: "Client's contact is required" }).min(4),
  brand: z.string().min(1).default(""),
  model: z.string().min(1).default(""),
  problem: z.optional(z.string()).default(""),
  fix: z.optional(z.string()).default(""),
  amount: z.number().default(0),
});

export type VisitForm = NumberOrEmptyString<z.infer<typeof VisitSchema>>;

export function createVisitForm(visitOrNextId: Visit | number): VisitForm {
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
      }
    : { ...visitOrNextId, date: new Date(visitOrNextId.date) };
}

export const visitToCSVRow = (
  visit: Visit,
): {
  [key in keyof Visit]?: string | number | boolean;
} => {
  return visit;
};

export const toCSV = (array: Visit[]): string => {
  const serializedVisits = array.map((visit) => visitToCSVRow(visit));
  return Papa.unparse(serializedVisits);
};

export const CSVRowToVisit = (visit: {
  [key in keyof Visit]: string;
}): Visit => {
  return {
    ...visit,
    id: +visit.id,
    date: +visit.date,
    updatedAt: +visit.updatedAt,
    amount: +visit.amount
  };
};

export const parseCSV = (csv: string): Visit[] => {
  if (!csv) return [];
  const { data, errors, meta } = Papa.parse(csv, {
    header: true,
  });
  if (meta.aborted || errors.length) throw "Cannot parse CSV";
  // use ref as ID
  return data
    .map(({ ref, ...item }) => ({ ...item, id: ref ?? item.id }))
    .map(CSVRowToVisit);
};

export const visitToJSON = (visit: Update<number, Visit>): any => visit;

export const JSONToVisit = (visit: any): Update<number, Visit> => ({
  ...visit,
  id: +visit.id,
});
