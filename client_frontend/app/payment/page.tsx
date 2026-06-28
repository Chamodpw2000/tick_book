"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PendingOrderSummary = {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImageUrl?: string | null;
  currency: string;
  totalTickets: number;
  totalAmount: number;
  items: Array<{
    ticketTypeName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

const PAYMENT_WINDOW_MS = 12 * 60 * 1000;

const formatAmount = (value: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export default function PaymentPage() {
  const router = useRouter();
  
  const [bookingId, setBookingId] = React.useState<string | null>(null);
  const [orderSummary, setOrderSummary] = React.useState<PendingOrderSummary | null>(null);
  const [paymentExpiresAt, setPaymentExpiresAt] = React.useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const [isPaymentExpired, setIsPaymentExpired] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "error" | "success"; text: string } | null>(null);
  
  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");

  const handleCardNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digitsOnly);
  };

  const handleExpiryChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    const formatted =
      digitsOnly.length <= 2
        ? digitsOnly
        : `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    setExpiry(formatted);
  };

  const handleCvcChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 3);
    setCvc(digitsOnly);
  };

  let submitButtonText = "Pay Now";
  if (isSubmitting) {
    submitButtonText = "Processing...";
  } else if (isPaymentExpired) {
    submitButtonText = "Payment Timed Out";
  } else if (orderSummary) {
    submitButtonText = `Pay ${formatAmount(orderSummary.totalAmount, orderSummary.currency)}`;
  }

  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  const countdownLabel = `${minutes}:${seconds}`;

  React.useEffect(() => {
    const storedBookingId = globalThis.window.localStorage.getItem("PENDING_BOOKING_ID");
    if (!storedBookingId) {
      router.replace("/");
      return;
    }

    const storedSummary = globalThis.window.localStorage.getItem("PENDING_ORDER_SUMMARY");
    if (storedSummary) {
      try {
        setOrderSummary(JSON.parse(storedSummary) as PendingOrderSummary);
      } catch {
        setOrderSummary(null);
      }
    }

    const timerKey = `PENDING_PAYMENT_EXPIRES_AT_${storedBookingId}`;
    const storedExpiresAtRaw = globalThis.window.localStorage.getItem(timerKey);
    const parsedExpiresAt = storedExpiresAtRaw ? Number(storedExpiresAtRaw) : NaN;
    const initialExpiresAt = Number.isFinite(parsedExpiresAt)
      ? parsedExpiresAt
      : Date.now() + PAYMENT_WINDOW_MS;

    if (!Number.isFinite(parsedExpiresAt)) {
      globalThis.window.localStorage.setItem(timerKey, String(initialExpiresAt));
    }

    setPaymentExpiresAt(initialExpiresAt);

    setBookingId(storedBookingId);
  }, [router]);

  React.useEffect(() => {
    if (!paymentExpiresAt || !bookingId) return;

    const tick = () => {
      const diffSeconds = Math.max(0, Math.ceil((paymentExpiresAt - Date.now()) / 1000));
      setRemainingSeconds(diffSeconds);

      if (diffSeconds === 0) {
        setIsPaymentExpired(true);
        setIsSubmitting(false);
      }
    };

    tick();
    const intervalId = globalThis.window.setInterval(tick, 1000);
    return () => globalThis.window.clearInterval(intervalId);
  }, [paymentExpiresAt, bookingId]);

  React.useEffect(() => {
    if (!isPaymentExpired) return;

    setMessage((prev) =>
      prev?.type === "success"
        ? prev
        : {
            type: "error",
            text: "Payment time expired. Your booking has timed out. Please book again.",
          }
    );
  }, [isPaymentExpired]);

  const onSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!bookingId) return;

    if (isPaymentExpired) {
      setMessage({
        type: "error",
        text: "Payment time expired. Please create a new booking.",
      });
      return;
    }

    if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
      setMessage({ type: "error", text: "Please fill in all card details." });
      return;
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      setMessage({ type: "error", text: "Card number must be exactly 16 digits." });
      return;
    }

    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      setMessage({ type: "error", text: "Expiry must be in MM/YY format." });
      return;
    }

    const month = Number(expiryMatch[1]);
    if (month < 1 || month > 12) {
      setMessage({ type: "error", text: "Expiry month must be between 01 and 12." });
      return;
    }

    if (!/^\d{3}$/.test(cvc)) {
      setMessage({ type: "error", text: "CVC must be exactly 3 digits." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        bookingId: /^\d+$/.test(bookingId) ? Number(bookingId) : bookingId,
        paymentMethod: "CARD",
        providerName: "stripe",
        providerReference: `ref-${Math.random().toString(36).substring(2, 10)}`,
        transactionType: "INITIATED"
      };

      const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL ?? "http://localhost:3006";
      const res = await fetch(`${baseUrl}/payments/saga`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Payment processing failed");
      }

      setMessage({ type: "success", text: "Payment successful! Your tickets are confirmed." });
      globalThis.window.localStorage.removeItem("PENDING_BOOKING_ID");
      globalThis.window.localStorage.removeItem("PENDING_ORDER_SUMMARY");
      globalThis.window.localStorage.removeItem(`PENDING_PAYMENT_EXPIRES_AT_${bookingId}`);
      
      // Optionally redirect after a few seconds
      setTimeout(() => {
        router.push("/events");
      }, 3000);
      
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to process payment. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookingId) {
    return (
      <main className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-12">
        <p className="text-slate-400">Loading payment details...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-12">
      <Card className="w-full border-white/10 bg-slate-900/80 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Complete Payment</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your card details to finalize your booking #{bookingId}.
          </CardDescription>
          <div
            className={`mx-auto mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${
              isPaymentExpired
                ? "border-red-400/40 bg-red-500/10 text-red-300"
                : remainingSeconds <= 120
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                  : "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
            }`}
          >
            <span>Payment Timer</span>
            <span>{countdownLabel}</span>
          </div>
        </CardHeader>

        <CardContent>
          {message?.type === "success" ? (
            <div className="rounded-xl border border-green-400/20 bg-green-400/10 p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-400/20 text-green-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-400">{message.text}</h3>
              <p className="mt-2 text-sm text-slate-300">Redirecting to your events...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              {orderSummary && (
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                  <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
                    {orderSummary.eventImageUrl && (
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
                        <img
                          src={orderSummary.eventImageUrl}
                          alt={orderSummary.eventName}
                          className="h-64 w-full object-cover lg:h-80"
                        />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Order Details</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{orderSummary.eventName}</h3>
                      <p className="mt-1 text-sm text-slate-300">{orderSummary.eventDate}</p>
                      <p className="text-sm text-slate-300">{orderSummary.eventLocation}</p>

                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                        {orderSummary.items.map((item, index) => (
                          <div key={`${item.ticketTypeName}-${index}`} className="flex items-center justify-between text-sm">
                            <span className="text-slate-200">
                              {item.ticketTypeName} x {item.quantity}
                            </span>
                            <span className="font-medium text-white">
                              {formatAmount(item.subtotal, orderSummary.currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">Total Tickets</span>
                          <span className="font-medium text-white">{orderSummary.totalTickets}</span>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="font-semibold text-slate-200">Full Amount</span>
                          <span className="text-xl font-bold text-cyan-300">
                            {formatAmount(orderSummary.totalAmount, orderSummary.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200" htmlFor="cardName">
                  Name on Card
                </label>
                <input
                  id="cardName"
                  type="text"
                  placeholder="John Doe"
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={isPaymentExpired || isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200" htmlFor="cardNumber">
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={16}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  disabled={isPaymentExpired || isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200" htmlFor="expiry">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="expiry"
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                    value={expiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    disabled={isPaymentExpired || isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200" htmlFor="cvc">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    type="text"
                    placeholder="123"
                    maxLength={3}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                    value={cvc}
                    onChange={(e) => handleCvcChange(e.target.value)}
                    disabled={isPaymentExpired || isSubmitting}
                  />
                </div>
              </div>

              {message?.type === 'error' && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                className="mt-6 w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-300"
                disabled={isSubmitting || isPaymentExpired}
              >
                {submitButtonText}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
