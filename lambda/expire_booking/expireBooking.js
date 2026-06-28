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
 * expireBooking Lambda
 *
 * Triggers the booking service to scan all PENDING bookings created within
 * the last hour and expire any that have been pending for more than 15 minutes.
 *
 * Intended to be invoked on a schedule (e.g. EventBridge every 5 minutes).
 *
 * Input:  {} (no input required – the booking service determines stale bookings)
 *
 * Env:
 * - BOOKING_SERVICE_URL  Base URL of the booking service (e.g. http://booking-service:3006)
 *
 * Flow:
 * 1) PATCH booking_service /bookings/expire-stale
 * 2) Return { expiredBookingIds, expiredCount, message }
 */
export const handler = async (_event) => {
  try {
    const bookingServiceUrl = requireEnv("BOOKING_SERVICE_URL");

    const url = `${normalizeBaseUrl(bookingServiceUrl)}/bookings/expire-stale`;

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
        data?.message ||
        rawBody ||
        `HTTP ${response.status} ${response.statusText}`;
      throw new Error(`Failed to expire stale bookings: ${details}`);
    }

    console.log(
      `[ExpireBooking] ${data?.expiredCount ?? 0} booking(s) expired. IDs: [${(data?.expiredBookingIds ?? []).join(", ")}]`
    );

    return {
      message: data?.message,
      expiredBookingIds: data?.expiredBookingIds ?? [],
      expiredCount: data?.expiredCount ?? 0,
    };
  } catch (error) {
    throw new Error(`[ExpireBooking] ${error.message}`);
  }
};
