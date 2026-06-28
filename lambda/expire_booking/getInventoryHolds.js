const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, "");

/**
 * Get relevant inventory hold IDs for a given booking.
 * 
 * Input:
 * { bookingId: number|string }
 *
 * Env:
 * - INVENTORY_SERVICE_URL
 *
 * Calls:
 * - GET /inventory/booking/:bookingId/hold-ids
 */
export const handler = async (event) => {
  const bookingId = event?.bookingId;

  try {
    if (bookingId === undefined || bookingId === null || bookingId === "") {
      throw new Error("bookingId is required");
    }

    const inventoryServiceUrl = requireEnv("INVENTORY_SERVICE_URL");
    const url = `${normalizeBaseUrl(inventoryServiceUrl)}/inventory/booking/${encodeURIComponent(
      String(bookingId)
    )}/hold-ids`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Inventory service error: ${response.status} ${text}`);
    }

    const data = await response.json();

    return {
      holdIds: Array.isArray(data?.holdIds) ? data.holdIds : [],
    };
  } catch (error) {
    throw new Error(`[GetInventoryHolds] ${error.message}`);
  }
};
