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
 * Input: { bookingId }
 * Env: BOOKING_SERVICE_URL
 * Calls: GET /bookings/:bookingId/payment-availability
 *
 * Returns the booking_service response, plus httpStatus.
 * Does not throw for 4xx responses (so callers can inspect availability).
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
    )}/payment-availability`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rawBody = await response.text().catch(() => "");
    const data = safeJsonParse(rawBody);

    return {
      httpStatus: response.status,
      ...data,
    };
  } catch (error) {
    throw new Error(`[CheckPaymentAvailability] ${error.message}`);
  }
};
