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

/**
 * Input:
 * {
 *   bookingId: number|string,
 *   userId: number|string,
 *   eventId: number|string,
 *   amount: number|string,
 *   currency: string,
 *   paymentMethod: string,
 *   providerName: string,
 *   providerReference?: string,
 *   transactionType?: string
 * }
 *
 * Env:
 * - PAYMENT_SERVICE_URL
 *
 * Flow:
 * 1) POST payment_service /payments
 */
export const handler = async (event) => {
  const bookingId = event?.bookingId;
  const userIdInput = event?.userId;
  const eventIdInput = event?.eventId;
  const amountInput = event?.amount;
  const currencyInput = event?.currency;
  const paymentMethod = event?.paymentMethod;
  const providerName = event?.providerName;
  const providerReference = event?.providerReference;
  const transactionType = event?.transactionType;

  try {
    const parsedBookingId = asPositiveInt(bookingId);
    if (!parsedBookingId) {
      throw new Error("bookingId must be a positive integer");
    }

    const parsedUserId = asPositiveInt(userIdInput);
    if (!parsedUserId) {
      throw new Error("userId must be a positive integer");
    }

    const parsedEventId = asPositiveInt(eventIdInput);
    if (!parsedEventId) {
      throw new Error("eventId must be a positive integer");
    }

    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error("amount must be a positive number");
    }

    if (!currencyInput || typeof currencyInput !== "string") {
      throw new Error("currency is required");
    }

    if (!paymentMethod || typeof paymentMethod !== "string") {
      throw new Error("paymentMethod is required");
    }

    if (!providerName || typeof providerName !== "string") {
      throw new Error("providerName is required");
    }

    const paymentServiceUrl = requireEnv("PAYMENT_SERVICE_URL");

    const createPaymentUrl = `${normalizeBaseUrl(paymentServiceUrl)}/payments`;

    const paymentResponse = await fetch(createPaymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: parsedBookingId,
        userId: parsedUserId,
        eventId: parsedEventId,
        amount: parsedAmount,
        currency: currencyInput.trim(),
        paymentMethod: paymentMethod.trim(),
        providerName: providerName.trim(),
        providerReference: providerReference ? String(providerReference).trim() : undefined,
        transactionType: transactionType ? String(transactionType).trim() : undefined,
      }),
    });

    const paymentRaw = await paymentResponse.text().catch(() => "");
    const paymentData = safeJsonParse(paymentRaw);

    if (!paymentResponse.ok) {
      const details =
        paymentData?.message ||
        paymentRaw ||
        `HTTP ${paymentResponse.status} ${paymentResponse.statusText}`;
      throw new Error(`Failed to create payment: ${details}`);
    }

    return {
      bookingId: parsedBookingId,
      paymentId: paymentData?.id,
      payment: paymentData,
    };
  } catch (error) {
    throw new Error(`[MakePayment] ${error.message}`);
  }
};
