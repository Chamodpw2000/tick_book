import { paymentClient } from "./client";

export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  eventId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  providerName: string;
  providerReference: string | null;
  status: "PAID" | "REFUNDED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  transactions: any[];
  refunds: any[];
}

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const response = await paymentClient.get("/payments");
    return response.data;
  },

  refund: async (paymentId: number, reason?: string): Promise<any> => {
    const response = await paymentClient.post(`/${paymentId}/refunds`, { reason });
    return response.data;
  },
};
