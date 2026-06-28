export const serviceUrls = {
  artist: process.env.NEXT_PUBLIC_ARTIST_SERVICE_URL ?? "http://localhost:3004",
  event: process.env.NEXT_PUBLIC_EVENT_SERVICE_URL ?? "http://localhost:3001",
  booking: process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL ?? "http://localhost:3003",
  payment: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL ?? "http://localhost:3006",
  inventory: process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL ?? "http://localhost:3007",
  user: process.env.NEXT_PUBLIC_USER_SERVICE_URL ?? "http://localhost:3002",
  venue: process.env.NEXT_PUBLIC_VENUE_SERVICE_URL ?? "http://localhost:3005",
} as const;

export type ServiceName = keyof typeof serviceUrls;

export const getServiceUrl = (service: ServiceName) => serviceUrls[service];
