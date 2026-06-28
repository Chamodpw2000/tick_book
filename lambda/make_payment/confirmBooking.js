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
 * Confirm booking after payment succeeds.
 *
 * Input:
 * { bookingId: number|string, reason?: string }
 *
 * Env:
 * - BOOKING_SERVICE_URL
 *
 * Calls:
 * - PATCH /bookings/:bookingId/confirm
 */
export const handler = async (event) => {
  const bookingId = event?.bookingId;
  const reason = event?.reason;

  try {
    if (bookingId === undefined || bookingId === null || bookingId === "") {
      throw new Error("bookingId is required");
    }

    const bookingServiceUrl = requireEnv("BOOKING_SERVICE_URL");
    const url = `${normalizeBaseUrl(bookingServiceUrl)}/bookings/${encodeURIComponent(
      String(bookingId),
    )}/confirm`;

    const payload = {};
    if (typeof reason === "string" && reason.trim()) {
      // BookingStatusHistory.reason is VARCHAR(255)
      payload.reason = reason.trim().slice(0, 255);
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
      changed: data?.changed,
    };
  } catch (error) {
    throw new Error(`[ConfirmBooking] ${error.message}`);
  }
};
