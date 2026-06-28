import { inventoryClient } from "./client";

export interface InventoryRecord {
  id: number;
  eventId: number;
  ticketTypeId: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryHold {
  id: number;
  inventoryId: number;
  eventId: number;
  ticketTypeId: number;
  userId: number;
  bookingId?: number;
  quantity: number;
  status: "ACTIVE" | "CONFIRMED" | "EXPIRED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
}

export const inventoryService = {
  getRecords: async (): Promise<InventoryRecord[]> => {
    const response = await inventoryClient.get("/records");
    return response.data;
  },

  getHolds: async (): Promise<InventoryHold[]> => {
    const response = await inventoryClient.get("/holds");
    return response.data;
  },

  releaseHold: async (holdId: number): Promise<void> => {
    await inventoryClient.patch(`/holds/${holdId}/release`);
  }
};
