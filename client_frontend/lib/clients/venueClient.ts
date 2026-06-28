import { venueApi } from "../api";

export const venueClient = {
  list: () => venueApi.get("/venues"),
  byId: (id: string) => venueApi.get(`/venues/${encodeURIComponent(id)}`),
};
