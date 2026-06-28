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

export const handler = async (event) => {
  const {
    userId,
    eventId,
    bookingReference,
    status,
    totalAmount,
    currency,
    paymentStatus,
    items,
  } = event ?? {};

  try {
    const bookingServiceUrl = requireEnv("BOOKING_SERVICE_URL");

    if (userId === undefined || eventId === undefined) {
      throw new Error("userId and eventId are required");
    }

    if (!currency) {
      throw new Error("currency is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("items must be a non-empty array");
    }

    const normalizedItems = items.map((item) => {
      const ticketTypeId = item?.ticketTypeId;
      const quantity = item?.quantity;
      const unitPrice = item?.unitPrice;
      const subtotal = item?.subtotal;

      if (
        ticketTypeId === undefined ||
        quantity === undefined ||
        unitPrice === undefined ||
        subtotal === undefined
      ) {
        throw new Error(
          "Each item must include ticketTypeId, quantity, unitPrice, and subtotal",
        );
      }

      return { ticketTypeId, quantity, unitPrice, subtotal };
    });

    const computedTotal = normalizedItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    if (!Number.isFinite(computedTotal)) {
      throw new TypeError("items subtotals must be numeric");
    }

    const finalTotalAmount =
      totalAmount === undefined || totalAmount === null ? computedTotal : totalAmount;

    const finalBookingReference =
      bookingReference || `BK-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    const url = `${normalizeBaseUrl(bookingServiceUrl)}/bookings/with-items`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        eventId,
        bookingReference: finalBookingReference,
        status: status ?? "PENDING",
        totalAmount: finalTotalAmount,
        currency,
        paymentStatus: paymentStatus ?? "PENDING",
        items: normalizedItems,
      }),
    });

    const rawBody = await response.text().catch(() => "");
    const data = safeJsonParse(rawBody);

    if (!response.ok) {
      const details =
        data?.message || rawBody || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${details}`);
    }

    return {
      bookingId: data?.booking?.id,
      bookingReference: data?.booking?.bookingReference,
      status: data?.booking?.status,
      totalAmount: data?.booking?.totalAmount,
      currency: data?.booking?.currency,
      paymentStatus: data?.booking?.paymentStatus,
      items: data?.items,
    };
  } catch (error) {
    throw new Error(`[CreateBooking] ${error.message}`);
  }
};
