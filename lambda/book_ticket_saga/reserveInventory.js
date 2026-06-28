const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
};

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, "");

const normalizeHoldsFromResponse = (data) => {
  if (Array.isArray(data?.holds)) {
    return data.holds;
  }

  if (data?.holdId) {
    return [{ holdId: data.holdId, status: data.status, expiresAt: data.expiresAt }];
  }

  return [];
};

export const handler = async (event) => {
  const { eventId, userId, bookingId, holdExpiryMinutes, items } = event ?? {};

  try {
    if (eventId === undefined || userId === undefined) {
      throw new Error("eventId and userId are required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("items must be a non-empty array");
    }

    const inventoryServiceUrl = requireEnv("INVENTORY_SERVICE_URL");
    const url = `${normalizeBaseUrl(inventoryServiceUrl)}/inventory/holds`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        userId,
        bookingId: bookingId ?? null,
        holdExpiryMinutes: holdExpiryMinutes ?? 15,
        items,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Failed to reserve inventory");
    }

    // Support both legacy single-hold response and new multi-hold response.
    const holds = normalizeHoldsFromResponse(data);
    const holdIds = holds.map((h) => h.holdId);

    return {
      expiresAt: data?.expiresAt,
      holdIds,
      holds,
    };
  } catch (error) {
    throw new Error(`[ReserveInventory] ${error.message}`);
  }
};
