import { paymentApi } from "../api";

export const paymentClient = {
  list: () => paymentApi.get("/payments"),
  byId: (id: string | number) => paymentApi.get(`/payments/${encodeURIComponent(String(id))}`),
};
