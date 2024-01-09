import { AxiosResponse } from "axios";

import { JSONToVisit, Visit, visitToJSON } from "@/models/Visit";
import { Update } from "@/utils/types";

import api from ".";

const unwrapVisit = (response: Promise<AxiosResponse>): Promise<Update<number, Visit>> =>
  response.then((r) => JSONToVisit(r.data.visit));

export const getVisit = ({ id }: { id: Visit["id"] }) =>
  unwrapVisit(api.get(`/visits/${id}`));

export const createVisit = ({ visit }: { visit: Visit }) =>
  unwrapVisit(api.post("/visits", { visit: visitToJSON(visit) })) as Promise<Visit>;

/**
 * This is actually an upsert method
 */
export const updateVisit = ({ visit }: { visit: Visit }) =>
  unwrapVisit(api.patch("/visits", { visit: visitToJSON(visit) })) as Promise<Visit>;

/**
 * Soft delete on server
 */
export const deleteVisit = ({ id }: { id: Visit["id"] }) =>
  api.delete(`/visits/${id}`).then((r) => r.data.timestamp as number); // lose the result
