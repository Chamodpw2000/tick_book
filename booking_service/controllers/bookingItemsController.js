import { prisma } from "../lib/prismaClient.js";

export const createBookingItem = async (req, res) => {
  const { bookingId, ticketTypeId, quantity, unitPrice, subtotal } = req.body;

  if (
    bookingId === undefined ||
    ticketTypeId === undefined ||
    quantity === undefined ||
    unitPrice === undefined ||
    subtotal === undefined
  ) {
    return res.status(400).json({
      message:
        "bookingId, ticketTypeId, quantity, unitPrice, and subtotal are required",
    });
  }

  try {
    const bookingItem = await prisma.bookingItem.create({
      data: {
        bookingId,
        ticketTypeId,
        quantity,
        unitPrice: Number(unitPrice).toFixed(2),
        subtotal: Number(subtotal).toFixed(2),
      },
    });

    return res.status(201).json(bookingItem);
  } catch (error) {
    console.error("Failed to create booking item", error);
    return res.status(500).json({ message: "Failed to create booking item" });
  }
};

export const getBookingItems = async (req, res) => {
  try {
    const bookingItems = await prisma.bookingItem.findMany({
      orderBy: { id: "desc" },
    });

    return res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Failed to fetch booking items", error);
    return res.status(500).json({ message: "Failed to fetch booking items" });
  }
};
