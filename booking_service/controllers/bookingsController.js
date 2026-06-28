import { prisma } from "../lib/prismaClient.js";
import {
  SFNClient,
  StartExecutionCommand,
  StartSyncExecutionCommand,
} from "@aws-sdk/client-sfn";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const getAwsClientConfig = () => {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  return {
    region,
    ...(accessKeyId && secretAccessKey
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          },
        }
      : {}),
  };
};

const sfnClient = new SFNClient(getAwsClientConfig());
const sqsClient = new SQSClient(getAwsClientConfig());

const BOOKING_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const normalizeBookingStatus = (value) => {
  if (value === undefined || value === null || value === "") {
    return "PENDING";
  }

  if (typeof value !== "string" || !BOOKING_STATUSES.has(value)) {
    return null;
  }

  return value;
};

const isStepFunctionsStateMachineArn = (value) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  // Expected: arn:aws:states:<region>:<accountId>:stateMachine:<name>
  return trimmed.startsWith("arn:") && trimmed.includes(":states:") && trimmed.includes(":stateMachine:");
};

const isSyncExecutionNotSupportedError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || error?.Code || "");
  return (
    message.includes("operation is not supported") ||
    message.includes("not supported by this type of state machine") ||
    name.includes("StateMachineTypeNotSupported")
  );
};

const validateCreateBookingSagaPayload = (payload) => {
  const { userId, eventId, currency, items } = payload ?? {};

  if (userId === undefined || eventId === undefined) {
    return "userId and eventId are required";
  }

  if (!currency || typeof currency !== "string" || !currency.trim()) {
    return "currency is required";
  }

  if (!Array.isArray(items) || items.length === 0) {
    return "items must be a non-empty array";
  }

  const hasInvalidItem = items.some(
    (item) =>
      item?.ticketTypeId === undefined ||
      item?.quantity === undefined ||
      item?.unitPrice === undefined ||
      item?.subtotal === undefined,
  );

  if (hasInvalidItem) {
    return "Each item must include ticketTypeId, quantity, unitPrice, and subtotal";
  }

  return null;
};

const buildCreateBookingSagaInput = (payload) => {
  const {
    userId,
    eventId,
    bookingReference,
    status,
    totalAmount,
    currency,
    paymentStatus,
    items,
  } = payload;

  return {
    userId,
    eventId,
    bookingReference,
    status,
    totalAmount,
    currency: currency.trim(),
    paymentStatus,
    items,
  };
};

const startSagaAsync = async ({ stateMachineArn, sagaInput, executionName }) => {
  const command = new StartExecutionCommand({
    stateMachineArn,
    input: JSON.stringify(sagaInput),
    name: executionName,
  });

  return sfnClient.send(command);
};

const startSagaSync = async ({ stateMachineArn, sagaInput, executionName }) => {
  const command = new StartSyncExecutionCommand({
    stateMachineArn,
    input: JSON.stringify(sagaInput),
    name: executionName,
  });

  return sfnClient.send(command);
};

export const createBooking = async (req, res) => {
  const {
    userId,
    eventId,
    bookingReference,
    status,
    totalAmount,
    currency,
    paymentStatus,
  } = req.body;

  const initialStatus = normalizeBookingStatus(status);
  if (!initialStatus) {
    return res.status(400).json({
      message: "status must be one of PENDING, CONFIRMED, FAILED, CANCELLED, EXPIRED",
    });
  }

  if (
    userId === undefined ||
    eventId === undefined ||
    !bookingReference ||
    totalAmount === undefined ||
    !currency ||
    !paymentStatus
  ) {
    return res.status(400).json({
      message:
        "userId, eventId, bookingReference, totalAmount, currency, and paymentStatus are required",
    });
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          userId,
          eventId,
          bookingReference,
          status: initialStatus,
          totalAmount: Number(totalAmount).toFixed(2),
          currency,
          paymentStatus,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: createdBooking.id,
          oldStatus: initialStatus,
          newStatus: initialStatus,
          reason: "Booking created",
        },
      });

      return createdBooking;
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error("Failed to create booking", error);
    return res.status(500).json({ message: "Failed to create booking" });
  }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings", error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

export const getBookingById = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Failed to fetch booking", error);
    return res.status(500).json({ message: "Failed to fetch booking" });
  }
};

export const getBookingDetails = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Failed to fetch booking details", error);
    return res.status(500).json({ message: "Failed to fetch booking details" });
  }
};

export const createTickets = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  const { tickets } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  if (!Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({ message: "tickets must be a non-empty array" });
  }

  try {
    const createdTickets = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const t of tickets) {
        const ticket = await tx.ticket.create({
          data: {
            bookingId,
            userId: t.userId,
            eventId: t.eventId,
            ticketCode: t.ticketCode,
            ticketTypeId: t.ticketTypeId,
            files: {
              create: {
                fileType: "PDF",
                s3Url: t.s3Url
              }
            }
          },
          include: { files: true }
        });
        results.push(ticket);
      }
      return results;
    });

    return res.status(201).json({ tickets: createdTickets });
  } catch (error) {
    console.error("Failed to create tickets", error);
    return res.status(500).json({ message: "Failed to create tickets" });
  }
};


export const confirmBooking = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  const rawReason = req.body?.reason;
  const reason =
    typeof rawReason === "string" && rawReason.trim() ? rawReason.trim().slice(0, 255) : null;

  const paymentStatus = "PAID";

  try {
    const result = await prisma.$transaction(async (tx) => {

      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        const error = new Error("BOOKING_NOT_FOUND");
        error.code = "BOOKING_NOT_FOUND";
        throw error;
      }

      if (booking.status === "CONFIRMED") {
        return { booking, changed: false };
      }

      if (booking.status === "CANCELLED") {
        const error = new Error("BOOKING_CANCELLED");
        error.code = "BOOKING_CANCELLED";
        throw error;
      }

      if (booking.status === "FAILED" || booking.status === "EXPIRED") {
        const error = new Error("BOOKING_EXPIRED");
        error.code = "BOOKING_EXPIRED";
        throw error;
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", paymentStatus },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: updatedBooking.id,
          oldStatus: booking.status,
          newStatus: "CONFIRMED",
          reason: reason ?? "Booking confirmed",
        },
      });

      return { booking: updatedBooking, changed: true };
    });

    console.log(result)

    if (result.changed) {
      try {
        const queueUrl = process.env.TICKET_GENERATION_QUEUE_URL;
        if (queueUrl) {
          await sqsClient.send(new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({ bookingId: result.booking.id, userId: result.booking.userId }),
          }));
          console.log(`[confirmBooking] Sent ticket generation message for booking ${bookingId}`);
        } else {
          console.warn(`[confirmBooking] TICKET_GENERATION_QUEUE_URL not set, skipping SQS message`);
        }
      } catch (sqsError) {
        console.error(`[confirmBooking] Failed to send SQS message:`, sqsError);
        // Do not fail the request, the booking is already confirmed
      }
    }

    return res.status(200).json({
      booking: result.booking,
      changed: result.changed,
    });
  } catch (error) {
    if (error?.code === "BOOKING_NOT_FOUND") {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (error?.code === "BOOKING_CANCELLED") {
      return res.status(409).json({ message: "Booking is CANCELLED" });
    }

    if (error?.code === "BOOKING_EXPIRED") {
      return res.status(409).json({ message: "Booking is EXPIRED" });
    }

    console.error("Failed to confirm booking", error);
    return res.status(500).json({ message: "Failed to confirm booking" });
  }
};

export const checkPaymentAvailability = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch inventory holds for this booking via the inventory service
    // For now, return an empty array; integrate inventory_service lookup if needed
    let holdIds = [];
    try {
      const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || "http://localhost:3007";
      const holdResponse = await fetch(
        `${inventoryServiceUrl.replace(/\/+$/, "")}/inventory/booking/${bookingId}/holds`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (holdResponse.ok) {
        const holdData = await holdResponse.json();
        holdIds = Array.isArray(holdData?.holds) ? holdData.holds.map((h) => h.id) : [];
      }
    } catch (error) {
      // If inventory service is unavailable, continue without holds
      console.warn(`[checkPaymentAvailability] Could not fetch holds: ${error.message}`);
    }

    const status = booking.status;
    if (status === "PENDING") {
      return res.status(200).json({
        booking,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status,
        availableForPayment: true,
        holdIds,
      });
    }

    if (status === "CONFIRMED") {
      return res.status(409).json({
        message: "Already confirmed",
        booking,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status,
        availableForPayment: false,
        holdIds,
      });
    }

    // Treat FAILED as EXPIRED (payment timeout).
    if (status === "FAILED" || status === "EXPIRED") {
      const bookingForResponse = { ...booking, status: "EXPIRED" };
      return res.status(409).json({
        message: "Booking expired (payment timeout)",
        booking: bookingForResponse,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status: "EXPIRED",
        availableForPayment: false,
        holdIds,
      });
    }

    if (status === "CANCELLED") {
      return res.status(409).json({
        message: "Booking cancelled",
        booking,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status,
        availableForPayment: false,
        holdIds,
      });
    }

    return res.status(409).json({
      message: `Payment not allowed for booking status: ${status}`,
      booking,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      status,
      availableForPayment: false,
      holdIds,
    });
  } catch (error) {
    console.error("Failed to check payment availability", error);
    return res.status(500).json({ message: "Failed to check payment availability" });
  }
};

export const createBookingWithItems = async (req, res) => {
  const {
    userId,
    eventId,
    bookingReference,
    status,
    totalAmount,
    currency,
    paymentStatus,
    items,
  } = req.body;

  const initialStatus = normalizeBookingStatus(status);
  if (!initialStatus) {
    return res.status(400).json({
      message: "status must be one of PENDING, CONFIRMED, FAILED, CANCELLED, EXPIRED",
    });
  }

  if (
    userId === undefined ||
    eventId === undefined ||
    !bookingReference ||
    totalAmount === undefined ||
    !currency ||
    !paymentStatus
  ) {
    return res.status(400).json({
      message:
        "userId, eventId, bookingReference, totalAmount, currency, and paymentStatus are required",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "items must be a non-empty array",
    });
  }

  for (const item of items) {
    if (
      item.ticketTypeId === undefined ||
      item.quantity === undefined ||
      item.unitPrice === undefined ||
      item.subtotal === undefined
    ) {
      return res.status(400).json({
        message:
          "Each item must include ticketTypeId, quantity, unitPrice, and subtotal",
      });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId,
          eventId,
          bookingReference,
          status: initialStatus,
          totalAmount: Number(totalAmount).toFixed(2),
          currency,
          paymentStatus,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: initialStatus,
          newStatus: initialStatus,
          reason: "Booking created",
        },
      });

      await tx.bookingItem.createMany({
        data: items.map((item) => ({
          bookingId: booking.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice).toFixed(2),
          subtotal: Number(item.subtotal).toFixed(2),
        })),
      });

      const bookingItems = await tx.bookingItem.findMany({
        where: { bookingId: booking.id },
        orderBy: { id: "asc" },
      });

      return {
        booking,
        items: bookingItems,
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create booking with items", error);
    return res
      .status(500)
      .json({ message: "Failed to create booking with items" });
  }
};

export const startCreateBookingSaga = async (req, res) => {
  // Default to synchronous execution for EXPRESS state machines.
  // Override to async by passing ?mode=async or waitForResult=false.
  const forceAsync =
    req.query.mode === "async" ||
    req.body?.mode === "async" ||
    req.query.waitForResult === "false" ||
    req.body?.waitForResult === false;

  const stateMachineArn = process.env.STATE_MACHINE_ARN_BOOKING?.trim();
  if (!stateMachineArn) {
    return res.status(500).json({ message: "STATE_MACHINE_ARN_BOOKING is not configured" });
  }

  if (!isStepFunctionsStateMachineArn(stateMachineArn)) {
    return res.status(500).json({
      message:
        "STATE_MACHINE_ARN_BOOKING must be a Step Functions state machine ARN (arn:aws:states:...:stateMachine:...), not an IAM role ARN.",
      configuredValue: stateMachineArn,
    });
  }

  const validationError = validateCreateBookingSagaPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const sagaInput = buildCreateBookingSagaInput(req.body);
    const executionName = `booking-saga-${sagaInput.eventId}-${sagaInput.userId}-${Date.now()}`.slice(0, 80);

    if (forceAsync) {
      const result = await startSagaAsync({ stateMachineArn, sagaInput, executionName });
      return res.status(202).json({
        message: "Saga execution started",
        executionArn: result.executionArn,
        startDate: result.startDate,
        mode: "async",
      });
    }

    let syncResult;
    try {
      syncResult = await startSagaSync({ stateMachineArn, sagaInput, executionName });
    } catch (error) {
      if (isSyncExecutionNotSupportedError(error)) {
        const result = await startSagaAsync({ stateMachineArn, sagaInput, executionName });
        return res.status(202).json({
          message:
            "State machine does not support synchronous execution (StartSyncExecution). Started saga asynchronously instead.",
          executionArn: result.executionArn,
          startDate: result.startDate,
          mode: "async",
          note: "Deploy this workflow as EXPRESS to use waitForResult=true.",
        });
      }

      throw error;
    }

    const parsedOutput = syncResult.output ? JSON.parse(syncResult.output) : null;

    if (syncResult.status !== "SUCCEEDED") {
      return res.status(500).json({
        message: "Saga execution failed",
        executionArn: syncResult.executionArn,
        status: syncResult.status,
        error: syncResult.error,
        cause: syncResult.cause,
      });
    }

    return res.status(200).json({
      message: "Saga execution completed",
      executionArn: syncResult.executionArn,
      status: syncResult.status,
      bookingId: parsedOutput?.bookingId ?? null,
      result: parsedOutput,
      mode: "sync",
    });
  } catch (error) {
    console.error("Failed to start create booking saga", error);
    return res.status(500).json({
      message: "Failed to start create booking saga",
      error: error?.message,
    });
  }
};

/**
 * expireStalePendingBookings
 *
 * Scans all bookings created within the last 1 hour, identifies those whose
 * status is still PENDING and whose createdAt is more than 15 minutes ago,
 * transitions them to EXPIRED, and writes a BookingStatusHistory record for
 * each one.
 *
 * Returns an array of the booking IDs that were expired.
 */
export const expireStalePendingBookings = async (req, res) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);   // now - 1 h
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000); // now - 15 min

  try {
    // 1. Fetch all bookings created within the past hour that are still PENDING.
    const recentPendingBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          gte: oneHourAgo, // created no earlier than 1 hour ago
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    // 2. Keep only the ones whose createdAt is older than 15 minutes.
    const staleBookings = recentPendingBookings.filter(
      (booking) => booking.createdAt <= fifteenMinutesAgo
    );

    if (staleBookings.length === 0) {
      return res.status(200).json({
        message: "No stale pending bookings found",
        expiredBookingIds: [],
        expiredCount: 0,
      });
    }

    const staleIds = staleBookings.map((b) => b.id);

    // 3. Expire them in a single transaction: bulk-update + insert history rows.
    await prisma.$transaction(async (tx) => {
      // Bulk status update
      await tx.booking.updateMany({
        where: { id: { in: staleIds } },
        data: { status: "EXPIRED", paymentStatus: "CANCELLED" },
      });

      // Insert a BookingStatusHistory record for every expired booking
      await tx.bookingStatusHistory.createMany({
        data: staleIds.map((id) => ({
          bookingId: id,
          oldStatus: "PENDING",
          newStatus: "EXPIRED",
          reason: "Booking expired: payment not completed within 15 minutes",
        })),
      });
    });

    console.log(
      `[expireStalePendingBookings] Expired ${staleIds.length} booking(s): ${staleIds.join(", ")}`
    );

    return res.status(200).json({
      message: `${staleIds.length} booking(s) expired successfully`,
      expiredBookingIds: staleIds,
      expiredCount: staleIds.length,
    });
  } catch (error) {
    console.error("[expireStalePendingBookings] Failed to expire stale bookings", error);
    return res.status(500).json({ message: "Failed to expire stale pending bookings" });
  }
};
