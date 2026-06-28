import { eventApi } from "../api";

export type CreateEventRequest = {
  venueId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  startTime: string; // ISO
  endTime: string; // ISO
  status?: string;
  bannerImage?: string; // base64 (prefer data URL)
};

export const eventClient = {
  create: (payload: CreateEventRequest) => eventApi.post("/events", payload),
  list: () => eventApi.get("/events"),
  byId: (id: string | number) => eventApi.get(`/events/${encodeURIComponent(String(id))}`),
};
