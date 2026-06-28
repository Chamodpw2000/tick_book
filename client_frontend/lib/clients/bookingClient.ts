import { bookingApi } from "../api";

export const bookingClient = {
  list: () => bookingApi.get("/bookings"),
  byId: (id: string | number) => bookingApi.get(`/bookings/${encodeURIComponent(String(id))}`),
  // Add methods as your backend exposes them
};
