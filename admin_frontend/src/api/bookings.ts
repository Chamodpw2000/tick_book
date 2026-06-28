import { bookingClient } from "./client";

export interface Booking {
  id: number;
  userId: number;
  eventId: number;
  bookingReference: string;
  status: "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "EXPIRED";
  totalAmount: string;
  currency: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const bookingService = {
  getAll: async (): Promise<Booking[]> => {
    const response = await bookingClient.get("/bookings");
    return response.data;
  },

  getById: async (id: number): Promise<{ booking: Booking }> => {
    const response = await bookingClient.get(`/bookings/${id}`);
    return response.data;
  },

  confirm: async (id: number, reason?: string): Promise<any> => {
    const response = await bookingClient.post(`/bookings/${id}/confirm`, { reason });
    return response.data;
  },

  expireStale: async (): Promise<any> => {
    const response = await bookingClient.post("/expire-stale");
    return response.data;
  }
};
