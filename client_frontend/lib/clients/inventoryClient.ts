import { inventoryApi } from "../api";

export const inventoryClient = {
  byEventIds: (eventIds: Array<string | number>) =>
    inventoryApi.get(`/inventory/events?eventIds=${encodeURIComponent(eventIds.map(String).join(","))}`),
};
