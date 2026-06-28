import { prisma } from "../lib/prismaClient.js";

export const createTickets = async (req, res) => {
  const { tickets } = req.body;

  if (!Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({
      message: "tickets must be a non-empty array",
    });
  }

  try {
    const createdTickets = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const ticketData of tickets) {
        // Create the Ticket record
        const ticket = await tx.ticket.create({
          data: {
            bookingId: ticketData.bookingId,
            eventId: ticketData.eventId,
            userId: String(ticketData.userId), // Convert to string in case schema expects it
            ticketCode: ticketData.ticketCode,
            ticketTypeId: ticketData.ticketTypeId,
            ticketStatus: ticketData.ticketStatus || "ISSUED",
          },
        });

        // Create the TicketFile record for the S3 PDF
        if (ticketData.s3Url) {
          await tx.ticketFile.create({
            data: {
              ticketId: ticket.id,
              fileType: "pdf",
              s3Url: ticketData.s3Url,
            },
          });
        }
        results.push(ticket);
      }
      return results;
    });

    return res.status(201).json({ tickets: createdTickets });
  } catch (error) {
    console.error("Failed to create tickets", error);
    return res.status(500).json({ message: "Failed to create tickets: " + error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { issuedAt: "desc" },
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets", error);
    return res.status(500).json({ message: "Failed to fetch tickets" });
  }
};
