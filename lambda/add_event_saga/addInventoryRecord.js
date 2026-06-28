export const handler = async (event) => {
  const { eventId, ticketTypeId, totalQuantity } = event ?? {};

  try {
    const response = await fetch(`${process.env.INVENTORY_SERVICE_URL}/inventory/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        ticketTypeId,
        totalQuantity,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Failed to create inventory record");
    }

    return {
      inventoryId: data.id,
      eventId: data.eventId,
      ticketTypeId: data.ticketTypeId,
      totalQuantity: data.totalQuantity,
      availableQuantity: data.availableQuantity,
      reservedQuantity: data.reservedQuantity,
    };
  } catch (error) {
    throw new Error(`[AddInventoryRecord] ${error.message}`);
  }
};