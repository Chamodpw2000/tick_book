import { prisma } from "../lib/prismaClient.js";

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const createInventoryRecord = async (req, res) => {
  const { eventId, ticketTypeId, totalQuantity } = req.body;

  const parsedEventId = parsePositiveInt(eventId);
  const parsedTicketTypeId = parsePositiveInt(ticketTypeId);
  const parsedTotalQuantity = parsePositiveInt(totalQuantity);

  if (!parsedEventId || !parsedTicketTypeId || !parsedTotalQuantity) {
    return res.status(400).json({
      message: "eventId, ticketTypeId, and totalQuantity must be positive integers",
    });
  }

  try {
    const inventory = await prisma.eventInventory.create({
      data: {
        eventId: parsedEventId,
        ticketTypeId: parsedTicketTypeId,
        totalQuantity: parsedTotalQuantity,
        availableQuantity: parsedTotalQuantity,
        reservedQuantity: 0,
      },
    });

    return res.status(201).json(inventory);
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Inventory already exists for this eventId and ticketTypeId",
      });
    }

    console.error("Failed to create inventory record", error);
    return res.status(500).json({ message: "Failed to create inventory record" });
  }
};

export const getHoldIdsForBooking = async (req, res) => {
  const bookingId = parsePositiveInt(req.params.bookingId);

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  try {
    // Fetch relevant hold IDs for the given booking
    const holds = await prisma.inventoryHold.findMany({
      where: { bookingId },
      select: { id: true },
    });

    const holdIds = holds.map((hold) => hold.id);

    return res.status(200).json({
      bookingId,
      holdIds,
    });
  } catch (error) {
    console.error("Failed to fetch hold IDs for booking", error);
    return res.status(500).json({ message: "Failed to fetch hold IDs for booking" });
  }
};

export const getInventoryByEvents = async (req, res) => {
  const { eventIds } = req.query;

  if (!eventIds || typeof eventIds !== "string") {
    return res.status(400).json({ message: "eventIds query parameter is required" });
  }

  const parsedEventIds = eventIds
    .split(",")
    .map(parsePositiveInt)
    .filter(Boolean);

  if (parsedEventIds.length === 0) {
    return res.status(400).json({ message: "eventIds must contain at least one valid positive integer" });
  }

  try {
    const inventories = await prisma.eventInventory.findMany({
      where: {
        eventId: {
          in: parsedEventIds,
        },
      },
    });

    return res.status(200).json(inventories);
  } catch (error) {
    console.error("Failed to fetch inventory by events", error);
    return res.status(500).json({ message: "Failed to fetch inventory by events" });
  }
};
