import { prisma } from "../lib/prismaClient.js";

const parsePositiveInt = (value) => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
};

const parseExpiryMinutes = (value) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
};

const normalizeAndAggregateHoldItems = ({ items, ticketTypeId, quantity }) => {
	const normalizedItems = Array.isArray(items) && items.length > 0 ? items : undefined;
	const hasLegacySingleItem = ticketTypeId !== undefined && quantity !== undefined;

	if (!normalizedItems && !hasLegacySingleItem) {
		return {
			error: {
				status: 400,
				message:
					"Provide either items: [{ ticketTypeId, quantity }] or ticketTypeId + quantity in request body",
			},
		};
	}

	const inputItems = normalizedItems ?? [{ ticketTypeId, quantity }];
	const itemTotalsByTicketType = new Map();

	for (const item of inputItems) {
		const parsedTicketTypeId = parsePositiveInt(item?.ticketTypeId);
		const parsedQuantity = parsePositiveInt(item?.quantity);

		if (!parsedTicketTypeId || !parsedQuantity) {
			return {
				error: {
					status: 400,
					message: "Each item must have positive integer ticketTypeId and quantity",
				},
			};
		}

		itemTotalsByTicketType.set(
			parsedTicketTypeId,
			(itemTotalsByTicketType.get(parsedTicketTypeId) ?? 0) + parsedQuantity,
		);
	}

	const aggregatedItems = Array.from(itemTotalsByTicketType.entries())
		.map(([ticketTypeIdValue, quantityValue]) => ({
			ticketTypeId: ticketTypeIdValue,
			quantity: quantityValue,
		}))
		.sort((a, b) => a.ticketTypeId - b.ticketTypeId);

	return {
		aggregatedItems,
		isLegacySingleItem: !normalizedItems,
	};
};

const createInventoryHoldsInTx = async (tx, params) => {
	const { eventId, userId, bookingId, expiresAt, aggregatedItems } = params;
	const holds = [];
	const inventories = [];

	for (const item of aggregatedItems) {
		const inventory = await tx.eventInventory.findUnique({
			where: {
				eventId_ticketTypeId: {
					eventId,
					ticketTypeId: item.ticketTypeId,
				},
			},
		});

		if (!inventory) {
			const error = new Error("INVENTORY_NOT_FOUND");
			error.code = "INVENTORY_NOT_FOUND";
			error.ticketTypeId = item.ticketTypeId;
			throw error;
		}

		const updatedRows = await tx.eventInventory.updateMany({
			where: {
				id: inventory.id,
				availableQuantity: {
					gte: item.quantity,
				},
			},
			data: {
				availableQuantity: {
					decrement: item.quantity,
				},
				reservedQuantity: {
					increment: item.quantity,
				},
			},
		});

		if (updatedRows.count === 0) {
			const error = new Error("INSUFFICIENT_INVENTORY");
			error.code = "INSUFFICIENT_INVENTORY";
			error.ticketTypeId = item.ticketTypeId;
			throw error;
		}

		const hold = await tx.inventoryHold.create({
			data: {
				inventoryId: inventory.id,
				eventId,
				ticketTypeId: item.ticketTypeId,
				bookingId,
				userId,
				quantity: item.quantity,
				status: "ACTIVE",
				expiresAt,
			},
		});

		const latestInventory = await tx.eventInventory.findUnique({
			where: { id: inventory.id },
		});

		holds.push(hold);
		inventories.push(latestInventory);
	}

	return { holds, inventories };
};

// Create an inventory hold (reserve tickets temporarily).
// This updates EventInventory counts (available -qty, reserved +qty) and creates an ACTIVE hold.
export const createInventoryHold = async (req, res) => {
	const { eventId, userId, bookingId, holdExpiryMinutes, items, ticketTypeId, quantity } =
		req.body;

	const parsedEventId = parsePositiveInt(eventId);
	const parsedUserId = typeof userId === "string" && userId.trim().length > 0 
		? userId.trim() 
		: (userId ? String(userId).trim() : null);

	if (!parsedEventId || !parsedUserId) {
		return res.status(400).json({
			message: "eventId must be a positive integer and userId must be a non-empty string",
		});
	}

	const parsedBookingId =
		bookingId === undefined || bookingId === null ? null : parsePositiveInt(bookingId);

	if (bookingId !== undefined && bookingId !== null && !parsedBookingId) {
		return res.status(400).json({
			message: "bookingId must be a positive integer when provided",
		});
	}

	const expiryMinutes = parseExpiryMinutes(holdExpiryMinutes);
	if (!expiryMinutes) {
		return res.status(400).json({
			message: "holdExpiryMinutes must be a positive number when provided",
		});
	}

	const expiresAt = new Date(Date.now() + Math.floor(expiryMinutes * 60 * 1000));
	const normalized = normalizeAndAggregateHoldItems({ items, ticketTypeId, quantity });
	if (normalized.error) {
		return res.status(normalized.error.status).json({ message: normalized.error.message });
	}

	const { aggregatedItems, isLegacySingleItem } = normalized;

	try {
		const result = await prisma.$transaction((tx) =>
			createInventoryHoldsInTx(tx, {
				eventId: parsedEventId,
				userId: parsedUserId,
				bookingId: parsedBookingId,
				expiresAt,
				aggregatedItems,
			}),
		);

		// Legacy single-item response shape for backward compatibility.
		if (isLegacySingleItem) {
			const hold = result.holds[0];
			const inventory = result.inventories[0];

			return res.status(201).json({
				holdId: hold.id,
				status: hold.status,
				expiresAt: hold.expiresAt,
				inventory: {
					id: inventory.id,
					eventId: inventory.eventId,
					ticketTypeId: inventory.ticketTypeId,
					totalQuantity: inventory.totalQuantity,
					availableQuantity: inventory.availableQuantity,
					reservedQuantity: inventory.reservedQuantity,
				},
			});
		}

		return res.status(201).json({
			expiresAt,
			holds: result.holds.map((hold, idx) => {
				const inventory = result.inventories[idx];
				return {
					holdId: hold.id,
					ticketTypeId: hold.ticketTypeId,
					quantity: hold.quantity,
					status: hold.status,
					expiresAt: hold.expiresAt,
					inventory: inventory
						? {
								id: inventory.id,
								eventId: inventory.eventId,
								ticketTypeId: inventory.ticketTypeId,
								totalQuantity: inventory.totalQuantity,
								availableQuantity: inventory.availableQuantity,
								reservedQuantity: inventory.reservedQuantity,
							}
						: null,
				};
			}),
		});
	} catch (error) {
		if (error?.code === "INVENTORY_NOT_FOUND") {
			return res.status(404).json({
				message: "Inventory record not found",
				ticketTypeId: error.ticketTypeId,
			});
		}

		if (error?.code === "INSUFFICIENT_INVENTORY") {
			return res.status(409).json({
				message: "Not enough available inventory",
				ticketTypeId: error.ticketTypeId,
			});
		}

		console.error("Failed to create inventory hold", error);
		return res.status(500).json({ message: "Failed to create inventory hold" });
	}
};

// Confirm an inventory hold after booking/payment succeeds.
// This does NOT change EventInventory quantities (they were already reserved in Step 2).
// It only transitions the hold from ACTIVE -> CONFIRMED and links a bookingId.
// If the hold is already expired, it will be marked EXPIRED and inventory is released.
export const confirmInventoryHoldForBooking = async (req, res) => {
	const holdId = parsePositiveInt(req.params.holdId);
	const bookingId = parsePositiveInt(req.body?.bookingId);

	if (!holdId) {
		return res.status(400).json({ message: "holdId must be a positive integer" });
	}

	if (!bookingId) {
		return res.status(400).json({ message: "bookingId must be a positive integer" });
	}

	const now = new Date();

	try {
		const result = await prisma.$transaction(async (tx) => {
			const hold = await tx.inventoryHold.findUnique({
				where: { id: holdId },
			});

			if (!hold) {
				throw new Error("HOLD_NOT_FOUND");
			}

			if (hold.status !== "ACTIVE") {
				throw new Error("HOLD_NOT_ACTIVE");
			}

			// If the hold has expired, expire it and release inventory back.
			if (hold.expiresAt <= now) {
				const expired = await tx.inventoryHold.updateMany({
					where: { id: holdId, status: "ACTIVE" },
					data: { status: "EXPIRED" },
				});

				if (expired.count === 1) {
					await tx.eventInventory.update({
						where: { id: hold.inventoryId },
						data: {
							availableQuantity: { increment: hold.quantity },
							reservedQuantity: { decrement: hold.quantity },
						},
					});
				}

				throw new Error("HOLD_EXPIRED");
			}

			// Confirm and link bookingId.
			const updatedHold = await tx.inventoryHold.update({
				where: { id: holdId },
				data: {
					status: "CONFIRMED",
					bookingId,
				},
			});

			const inventory = await tx.eventInventory.findUnique({
				where: { id: updatedHold.inventoryId },
			});

			return { hold: updatedHold, inventory };
		});

		return res.status(200).json({
			holdId: result.hold.id,
			status: result.hold.status,
			bookingId: result.hold.bookingId,
			expiresAt: result.hold.expiresAt,
			inventory: result.inventory
				? {
						id: result.inventory.id,
						eventId: result.inventory.eventId,
						ticketTypeId: result.inventory.ticketTypeId,
						totalQuantity: result.inventory.totalQuantity,
						availableQuantity: result.inventory.availableQuantity,
						reservedQuantity: result.inventory.reservedQuantity,
					}
				: null,
		});
	} catch (error) {
		if (error.message === "HOLD_NOT_FOUND") {
			return res.status(404).json({ message: "Inventory hold not found" });
		}

		if (error.message === "HOLD_NOT_ACTIVE") {
			return res.status(409).json({ message: "Inventory hold is not ACTIVE" });
		}

		if (error.message === "HOLD_EXPIRED") {
			return res.status(409).json({ message: "Inventory hold has expired" });
		}

		console.error("Failed to confirm inventory hold", error);
		return res.status(500).json({ message: "Failed to confirm inventory hold" });
	}
};

// Fetch all active holds for a booking.
export const getHoldsForBooking = async (req, res) => {
	const bookingId = parsePositiveInt(req.params.bookingId);
	if (!bookingId) {
		return res.status(400).json({ message: "bookingId must be a positive integer" });
	}

	try {
		const holds = await prisma.inventoryHold.findMany({
			where: { bookingId, status: "ACTIVE" },
			orderBy: { createdAt: "asc" },
		});

		return res.status(200).json({
			bookingId,
			holds: holds.map((h) => ({
				id: h.id,
				inventoryId: h.inventoryId,
				eventId: h.eventId,
				ticketTypeId: h.ticketTypeId,
				quantity: h.quantity,
				status: h.status,
				expiresAt: h.expiresAt,
			})),
		});
	} catch (error) {
		console.error("Failed to fetch holds for booking", error);
		return res.status(500).json({ message: "Failed to fetch holds for booking" });
	}
};
