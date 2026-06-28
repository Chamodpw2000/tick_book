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

const extractPaymentId = (event) => {
  const direct = asPositiveInt(event?.paymentId);
  if (direct) return direct;

  const fromPayment = asPositiveInt(event?.payment?.id);
  if (fromPayment) return fromPayment;

  const fromNested = asPositiveInt(event?.payment?.paymentId);
  if (fromNested) return fromNested;

  return null;
};

/**
 * Refund a payment (compensation step).
 *
 * Input:
 * - { paymentId: number|string }
 *   (also supports { payment: { id } })
 *
 * Env:
 * - PAYMENT_SERVICE_URL
 *
 * Calls:
 * - POST /payments/:paymentId/refunds
 */
export const handler = async (event) => {
  try {
    const paymentId = extractPaymentId(event);
    if (!paymentId) {
      throw new Error("paymentId must be a positive integer");
    }

    const paymentServiceUrl = requireEnv("PAYMENT_SERVICE_URL");
    const baseUrl = normalizeBaseUrl(paymentServiceUrl);

    const url = `${baseUrl}/payments/${encodeURIComponent(String(paymentId))}/refunds`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Refunded due to compensation function",
      }),
    });

    const rawBody = await response.text().catch(() => "");
    const data = safeJsonParse(rawBody);

    if (!response.ok) {
      const details =
        data?.message || rawBody || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(details);
    }

    return {
      httpStatus: response.status,
      paymentId,
      refundCreated: data?.refundCreated ?? null,
      refund: data?.refund ?? null,
      payment: data?.payment ?? null,
      message: data?.message ?? null,
    };
  } catch (error) {
    throw new Error(`[RefundPayment] ${error.message}`);
  }
};
