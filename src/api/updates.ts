import { Brand, JSONToBrand, brandToJSON } from "@/models/Brand";
import { JSONToVisit, Visit, visitToJSON } from "@/models/Visit";

import api from ".";

export const getUpdatesSince = async ({ epoch }: { epoch: number }) => {
  const { data } = await api.get(`/updatesSince?epoch=${epoch}`);
  return {
    visits: data.visits.map(JSONToVisit),
    brands: data.brands.map(JSONToBrand),
  } as {
    visits: Visit[];
    brands: Brand[];
  };
};

export const sync = async ({
  visitDeletes,
  brandDeletes,
  visitUpserts,
  brandUpserts,
}: {
  visitDeletes: Visit["id"][];
  brandDeletes: Brand["id"][];
  visitUpserts: Visit[];
  brandUpserts: Brand[];
}) => {
  const { data } = await api.patch(`/sync`, {
    visitDeletes,
    brandDeletes,
    visitUpserts: visitUpserts.map(visitToJSON),
    brandUpserts: brandUpserts.map(brandToJSON),
  });

  return {
    timestamp: +data.timestamp,
    visits: data.visits.map(JSONToVisit),
    brands: data.brands.map(JSONToBrand),
  } as {
    timestamp: number;
    visits: Visit[];
    brands: Brand[];
  };
};

export const upload = async ({
  visits,
  brands,
}: {
  visits: Visit[];
  brands: Brand[];
}) => {
  const { data } = await api.patch(`/upload`, {
    visits: visits.map(visitToJSON),
    brands: brands.map(brandToJSON),
  });

  return {
    visits: data.visits.map(JSONToVisit),
    brands: data.brands.map(JSONToBrand),
    timestamp: +data.timestamp,
  } as {
    timestamp: number;
    visits: Visit[];
    brands: Brand[];
  };
};
