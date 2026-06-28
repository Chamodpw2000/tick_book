const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, "");

const safeJsonParse = (text) => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const asPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeHoldIds = (event) => {
  const fromArray = event?.holdIds;
  if (Array.isArray(fromArray) && fromArray.length > 0) {
    const unique = new Set();
    for (const rawId of fromArray) {
      const parsed = asPositiveInt(rawId);
      if (!parsed) {
        throw new Error("holdIds must be an array of positive integers");
      }
      unique.add(parsed);
    }
    return Array.from(unique);
  }

  const single = asPositiveInt(event?.holdId);
  if (single) return [single];

  return null;
};

/**
 * Release inventory holds (compensation step).
 *
 * Input:
 * - { holdIds: number[] } OR { holdId: number }
 *
 * Env:
 * - INVENTORY_SERVICE_URL
 *
 * Calls:
 * - PATCH /inventory/holds/release  (multi)
 * - PATCH /inventory/holds/:holdId/release (single)
 *
 * Idempotency:
 * - If a hold is already RELEASED / not ACTIVE (409) or missing (404), this
 *   Lambda returns a success-shaped payload (so compensation can continue).
 */
export const handler = async (event) => {
  try {
    const holdIds = normalizeHoldIds(event);
    if (!holdIds) {
      throw new Error("holdIds (array) or holdId (number) is required");
    }

    const inventoryServiceUrl = requireEnv("INVENTORY_SERVICE_URL");
    const baseUrl = normalizeBaseUrl(inventoryServiceUrl);

    const isMulti = holdIds.length > 1;
    const url = isMulti
      ? `${baseUrl}/inventory/holds/release`
      : `${baseUrl}/inventory/holds/${encodeURIComponent(String(holdIds[0]))}/release`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: isMulti ? JSON.stringify({ holdIds }) : undefined,
    });

    const rawBody = await response.text().catch(() => "");
    const data = safeJsonParse(rawBody);

    if (response.ok) {
      if (isMulti) {
        return {
          httpStatus: response.status,
          releasedCount: data?.releasedCount ?? (Array.isArray(data?.holds) ? data.holds.length : 0),
          holds: data?.holds ?? [],
        };
      }

      return {
        httpStatus: response.status,
        holdId: data?.holdId ?? holdIds[0],
        status: data?.status ?? "RELEASED",
        expiresAt: data?.expiresAt ?? null,
        inventory: data?.inventory ?? null,
      };
    }

    // Treat common compensation edge cases as successful (idempotent behavior).
    if (response.status === 404 || response.status === 409) {
      return {
        httpStatus: response.status,
        treatedAsSuccess: true,
        message: data?.message || rawBody || "Hold already released or not active",
        holdIds,
      };
    }

    const details = data?.message || rawBody || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(details);
  } catch (error) {
    throw new Error(`[ReleaseInventory] ${error.message}`);
  }
};
