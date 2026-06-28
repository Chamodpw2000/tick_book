export const handler = async (event) => {
  const { eventId, name, price, currency, description, initialStock } = event ?? {};

  try {
    const response = await fetch(`${process.env.EVENT_SERVICE_URL}/events/${eventId}/ticket-types`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price,
        currency,
        description,
        initialStock,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Failed to create event ticket type");
    }

    return {
      ticketTypeId: data.id,
      eventId: data.eventId,
      name: data.name,
      price: data.price,
      currency: data.currency,
      description: data.description,
      initialStock: data.initialStock,
    };
  } catch (error) {
    throw new Error(`[AddEventTicketType] ${error.message}`);
  }
};