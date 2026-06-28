"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthTokenFromStorage, getAuthUserFromStorage } from "@/lib/auth";

type TicketType = {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  availableQuantity: number;
};

type BookingPanelProps = {
  ticketTypes: TicketType[];
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImageUrl: string | null;
};

export function BookingPanel({
  ticketTypes,
  eventId,
  eventName,
  eventDate,
  eventLocation,
  eventImageUrl,
}: Readonly<BookingPanelProps>) {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!getAuthTokenFromStorage());
  }, []);

  const handleQuantityChange = (id: string, quantity: number) => {
    setSelections((prev) => {
      const updated = { ...prev };
      if (quantity <= 0) {
        delete updated[id];
      } else {
        updated[id] = quantity;
      }
      return updated;
    });
  };

  const handleBookNow = async () => {
    const user = getAuthUserFromStorage();
    if (!user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const items = Object.entries(selections).map(([id, quantity]) => {
        const ticket = ticketTypes.find((t) => t.id === id);
        if (!ticket) throw new Error("Invalid ticket type");
        
        return {
          ticketTypeId: Number(ticket.id) || ticket.id, // Try numeric, fallback to string
          quantity,
          unitPrice: ticket.price,
          subtotal: ticket.price * quantity,
        };
      });

      const bookingReference = `BK-${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const payload = {
        userId: /^\d+$/.test(user.id) ? Number(user.id) : user.id,
        eventId: /^\d+$/.test(eventId) ? Number(eventId) : eventId,
        currency: "USD",
        items,
        bookingReference,
        status: "PENDING",
        paymentStatus: "PENDING",
      };

      const baseUrl = process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL ?? "http://localhost:3003";
      const res = await fetch(`${baseUrl}/bookings/saga`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to place booking");
      }

      const data = await res.json();
      
      if (data.bookingId || data.result?.bookingId) {
        const createdBookingId = data.bookingId || data.result?.bookingId;
        globalThis.window.localStorage.setItem("PENDING_BOOKING_ID", String(createdBookingId));
        globalThis.window.localStorage.setItem(
          "PENDING_ORDER_SUMMARY",
          JSON.stringify({
            eventId,
            eventName,
            eventDate,
            eventLocation,
            eventImageUrl,
            currency: "USD",
            totalTickets,
            totalAmount,
            items: items.map((item) => {
              const ticket = ticketTypes.find((t) => String(t.id) === String(item.ticketTypeId));
              return {
                ticketTypeName: ticket?.name ?? "Ticket",
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              };
            }),
          })
        );
        router.push("/payment");
        return; // prevent setting false submission state if unmounting
      } else {
        throw new Error("Booking successful but no ID returned.");
      }

    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Something went wrong while booking." });
      setIsSubmitting(false);
    }
  };

  const totalAmount = Object.entries(selections).reduce((sum, [id, qty]) => {
    const ticket = ticketTypes.find((t) => t.id === id);
    return sum + (ticket ? ticket.price * qty : 0);
  }, 0);

  const totalTickets = Object.values(selections).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h3 className="mb-4 text-xl font-semibold text-white">Select Tickets</h3>
      {ticketTypes.length === 0 ? (
        <p className="text-sm text-slate-300">No tickets available at the moment.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {ticketTypes.map((ticket) => {
            const currentQty = selections[ticket.id] || 0;
            const isSoldOut = !ticket.availableQuantity || ticket.availableQuantity < 1;

            return (
              <div
                key={ticket.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
                  currentQty > 0
                    ? "border-cyan-400 bg-cyan-900/20"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{ticket.name}</p>
                    <p className="mt-1 text-xs text-slate-300">{ticket.description || "General admission"}</p>
                    <p className="mt-2 text-xs text-amber-200">
                      {isSoldOut ? "Sold out" : `${ticket.availableQuantity} available`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      {ticket.price > 0 ? `LKR ${ticket.price.toFixed(2)}` : "Free"}
                    </p>
                  </div>
                </div>

                {!isSoldOut && (
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-sm font-medium text-slate-300">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(ticket.id, currentQty - 1)}
                        disabled={currentQty <= 0 || isSubmitting}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-4 text-center font-semibold text-white">{currentQty}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(ticket.id, currentQty + 1)}
                        disabled={currentQty >= (ticket.availableQuantity || 0) || currentQty >= 10 || isSubmitting}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-4 border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Total Tickets</span>
              <span className="font-semibold text-white">{totalTickets}</span>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-semibold text-slate-300">Order Total</span>
              <span className="text-2xl font-bold text-cyan-400">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            
            {message && (
              <div className={`mb-4 rounded-lg px-3 py-2 text-sm text-center font-medium ${
                message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-green-400/10 text-green-400 border border-green-400/20'
              }`}>
                {message.text}
              </div>
            )}
            
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleBookNow}
                disabled={totalTickets === 0 || isSubmitting}
                className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Booking..." : "Book Now"}
              </button>
            ) : (
              <div className="text-center">
                <p className="mb-3 text-sm text-amber-200">Please log in to book tickets.</p>
                <Link
                  href="/login"
                  className="block w-full rounded-lg bg-white/10 py-3 font-semibold text-white transition hover:bg-white/20 text-center"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
