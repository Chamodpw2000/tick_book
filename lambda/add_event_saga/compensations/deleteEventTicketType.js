export const handler = async (event) => {
  const ticketTypeId = event?.ticketTypeId ?? event?.id;

  if (!ticketTypeId) {
    throw new Error("[DeleteEventTicketType] ticketTypeId is required");
  }

  try {
    const response = await fetch(
      `${process.env.EVENT_SERVICE_URL}/events/ticket-types/${ticketTypeId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || "Failed to delete event ticket type");
    }

    return {
      ticketTypeId,
      deleted: true,
    };
  } catch (error) {
    throw new Error(`[DeleteEventTicketType] ${error.message}`);
  }
};