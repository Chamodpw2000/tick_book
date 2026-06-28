export const handler = async (event) => {
  const { bookingId, reason } = event ?? {};

  try {
    if (bookingId === undefined || bookingId === null) {
      throw new Error("bookingId is required");
    }

    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;
    if (!bookingServiceUrl) {
      throw new Error("BOOKING_SERVICE_URL is not set");
    }

    const url = `${bookingServiceUrl.replace(/\/+$/, "")}/bookings/${bookingId}/cancel`;

    const payload = {};
    if (typeof reason === "string" && reason.trim()) {
      // DB column is VARCHAR(255) in BookingStatusHistory.reason
      payload.reason = reason.trim().slice(0, 255);
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Failed to cancel booking");
    }

    return {
      booking: data?.booking,
      statusHistoryCreated: data?.statusHistoryCreated,
    };
  } catch (error) {
    throw new Error(`[CancelBooking] ${error.message}`);
  }
};
