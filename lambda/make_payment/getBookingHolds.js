import fetch from "node-fetch";

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

/**
 * Input: { bookingId }
 * Env: INVENTORY_SERVICE_URL
 * Calls: GET /inventory/booking/:bookingId/holds
 * Returns: { holdIds: [id, ...] }
 */
export const handler = async (event) => {
  const bookingId = event?.bookingId;
  if (!bookingId) throw new Error("bookingId is required");

  const inventoryServiceUrl = requireEnv("INVENTORY_SERVICE_URL");
  const url = `${inventoryServiceUrl.replace(/\/+$/, "")}/inventory/booking/${encodeURIComponent(String(bookingId))}/holds`;

  try {
    const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
    if (!response.ok) throw new Error(`Inventory service error: ${response.status}`);
    const data = await response.json();
    return { holdIds: Array.isArray(data.holds) ? data.holds.map((h) => h.id) : [] };
  } catch (error) {
    throw new Error(`[getBookingHolds] ${error.message}`);
  }
};
