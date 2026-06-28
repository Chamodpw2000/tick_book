import { prisma } from "../lib/prismaClient.js";

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

// Compensation for booking creation: cancel a booking if a later saga step fails.
// Idempotent: if already CANCELLED, returns 200 with current booking.
export const cancelBooking = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  const reason = "Canceled due to compensation function";

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        const error = new Error("BOOKING_NOT_FOUND");
        error.code = "BOOKING_NOT_FOUND";
        throw error;
      }

      if (booking.status === "CANCELLED") {
        return { booking, statusHistoryCreated: false };
      }

      if (booking.status === "CONFIRMED") {
        const error = new Error("BOOKING_ALREADY_CONFIRMED");
        error.code = "BOOKING_ALREADY_CONFIRMED";
        throw error;
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          oldStatus: booking.status,
          newStatus: "CANCELLED",
          reason,
        },
      });

      return { booking: updatedBooking, statusHistoryCreated: true };
    });

    return res.status(200).json({
      booking: result.booking,
      statusHistoryCreated: result.statusHistoryCreated,
    });
  } catch (error) {
    if (error?.code === "BOOKING_NOT_FOUND") {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (error?.code === "BOOKING_ALREADY_CONFIRMED") {
      return res.status(409).json({ message: "Booking is already CONFIRMED and cannot be cancelled" });
    }

    console.error("Failed to cancel booking", error);
    return res.status(500).json({ message: "Failed to cancel booking" });
  }
};

// Compensation for booking: revert a booking to PENDING status if a later saga step fails.
// Idempotent: if already PENDING, returns 200 with current booking.
export const revertBookingToPending = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  const reason = "Reverted to PENDING due to compensation function";

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        const error = new Error("BOOKING_NOT_FOUND");
        error.code = "BOOKING_NOT_FOUND";
        throw error;
      }

      if (booking.status === "PENDING") {
        return { booking, statusHistoryCreated: false };
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PENDING" },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          oldStatus: booking.status,
          newStatus: "PENDING",
          reason,
        },
      });

      return { booking: updatedBooking, statusHistoryCreated: true };
    });

    return res.status(200).json({
      booking: result.booking,
      statusHistoryCreated: result.statusHistoryCreated,
    });
  } catch (error) {
    if (error?.code === "BOOKING_NOT_FOUND") {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.error("Failed to revert booking to PENDING", error);
    return res.status(500).json({ message: "Failed to revert booking to PENDING" });
  }
};
