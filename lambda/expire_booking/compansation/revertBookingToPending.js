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

/**
 * Revert booking to PENDING status if a later payment or saga step fails.
 *
 * Input:
 * { bookingId: number|string }
 *
 * Env:
 * - BOOKING_SERVICE_URL
 *
 * Calls:
 * - PATCH /bookings/:bookingId/revert-pending
 */
export const handler = async (event) => {
  const bookingId = event?.bookingId;

  try {
    if (bookingId === undefined || bookingId === null || bookingId === "") {
      throw new Error("bookingId is required");
    }

    const bookingServiceUrl = requireEnv("BOOKING_SERVICE_URL");
    const url = `${normalizeBaseUrl(bookingServiceUrl)}/bookings/${encodeURIComponent(
      String(bookingId),
    )}/revert-pending`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rawBody = await response.text().catch(() => "");
    const data = safeJsonParse(rawBody);

    if (!response.ok) {
      const details =
        data?.message || rawBody || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(details);
    }

    return {
      booking: data?.booking,
      statusHistoryCreated: data?.statusHistoryCreated,
    };
  } catch (error) {
    throw new Error(`[RevertBookingToPending] ${error.message}`);
  }
};
