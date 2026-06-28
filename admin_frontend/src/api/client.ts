import axios from "axios";
import { getToken, clearAuth } from "@/lib/auth";

// Map of services and their base URLs
export const SERVICES = {
  EVENT: process.env.NEXT_PUBLIC_EVENT_SERVICE_URL || "http://localhost:3001",
  USER: process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3002",
  BOOKING: process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || "http://localhost:3003",
  ARTIST: process.env.NEXT_PUBLIC_ARTIST_SERVICE_URL || "http://localhost:3004",
  VENUE: process.env.NEXT_PUBLIC_VENUE_SERVICE_URL || "http://localhost:3005",
  PAYMENT: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || "http://localhost:3006",
  INVENTORY: process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || "http://localhost:3007",
};

// Create a flexible client generator
const createClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor — attach JWT token to every request
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for generic error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // If 401, clear auth and redirect to login via AuthProvider/AppShell
      if (error.response?.status === 401) {
        clearAuth();
      }

      const message = error.response?.data?.message || error.message || "An unexpected error occurred";
      return Promise.reject({ ...error, message });
    }
  );

  return client;
};

export const eventClient = createClient(SERVICES.EVENT);
export const userClient = createClient(SERVICES.USER);
export const bookingClient = createClient(SERVICES.BOOKING);
export const artistClient = createClient(SERVICES.ARTIST);
export const venueClient = createClient(SERVICES.VENUE);
export const paymentClient = createClient(SERVICES.PAYMENT);
export const inventoryClient = createClient(SERVICES.INVENTORY);

