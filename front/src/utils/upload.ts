import {
  Brand,
  toCSV as brandsToCSV,
  computeUpdates as computeUpdatedBrands,
  parseCSV as csvToBrands,
} from "@/models/Brand";
import {
  Visit,
  computeUpdates as computeUpdatedVisits,
  parseCSV as csvToVisits,
  toCSV as visitsToCSV,
} from "@/models/Visit";

const tableGlue = "\n----------1fy0uwr1737h15y0uw1llbr34k7h34pp----------\n";

export const appStateToCSV = ({ visits, brands }) => {
  return visitsToCSV(visits) + tableGlue + brandsToCSV(brands);
};

export const appStateFromCSV = (csv: string) => {
  if (!csv)
    return {
      visits: [],
      brands: [],
    };

  const tables = csv.replace(/\r/g, "").split(tableGlue);
  if (tables.length < 2)
    alert("Warning: The file uploaded is missing some data");
  if (tables.length > 2)
    throw new Error(
      `Invalid saved state: probably because "${tableGlue}" is used somewhere.`,
    );

  const visits = csvToVisits(tables[0]);
  const brands = csvToBrands(tables[1] || "");
  return {
    visits,
    brands,
  };
};

export const getAppStateUpdates = (
  { visits, brands }: { visits: Visit[]; brands: Brand[] },
  csv: string,
) => {
  const { visits: uploadedVisits, brands: uploadedBrands } =
    appStateFromCSV(csv);
  return {
    ...computeUpdatedVisits(visits, uploadedVisits),
    ...computeUpdatedBrands(brands, uploadedBrands),
  };
};
