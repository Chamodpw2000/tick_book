import { prisma } from "../lib/prismaClient.js";

const parsePositiveInt = (value) => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
};

const parseHoldIds = (value) => {
	if (!Array.isArray(value)) {
		return null;
	}

	const uniqueIds = new Set();
	for (const rawId of value) {
		const parsed = parsePositiveInt(rawId);
		if (!parsed) {
			return null;
		}
		uniqueIds.add(parsed);
	}

	return Array.from(uniqueIds);
};

// Release an inventory hold after payment fails / booking is cancelled.
// This restores EventInventory quantities (available +qty, reserved -qty)
// and transitions the hold from ACTIVE -> RELEASED.
export const releaseInventoryHold = async (req, res) => {
	const holdId = parsePositiveInt(req.params.holdId);

	if (!holdId) {
		return res.status(400).json({ message: "holdId must be a positive integer" });
	}

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

			const released = await tx.inventoryHold.updateMany({
				where: { id: holdId, status: "ACTIVE" },
				data: { status: "RELEASED" },
			});

			if (released.count === 0) {
				throw new Error("HOLD_NOT_ACTIVE");
			}

			const inventory = await tx.eventInventory.update({
				where: { id: hold.inventoryId },
				data: {
					availableQuantity: { increment: hold.quantity },
					reservedQuantity: { decrement: hold.quantity },
				},
			});

			const updatedHold = await tx.inventoryHold.findUnique({
				where: { id: holdId },
			});

			return { hold: updatedHold, inventory };
		});

		return res.status(200).json({
			holdId: result.hold.id,
			status: result.hold.status,
			expiresAt: result.hold.expiresAt,
			inventory: {
				id: result.inventory.id,
				eventId: result.inventory.eventId,
				ticketTypeId: result.inventory.ticketTypeId,
				totalQuantity: result.inventory.totalQuantity,
				availableQuantity: result.inventory.availableQuantity,
				reservedQuantity: result.inventory.reservedQuantity,
			},
		});
	} catch (error) {
		if (error.message === "HOLD_NOT_FOUND") {
			return res.status(404).json({ message: "Inventory hold not found" });
		}

		if (error.message === "HOLD_NOT_ACTIVE") {
			return res.status(409).json({ message: "Inventory hold is not ACTIVE" });
		}

		console.error("Failed to release inventory hold", error);
		return res.status(500).json({ message: "Failed to release inventory hold" });
	}
};

// Release multiple inventory holds in one call.
// Request body: { holdIds: number[] }
// Behavior: all-or-nothing; if any hold is missing or not ACTIVE, the transaction rolls back.
export const releaseInventoryHolds = async (req, res) => {
	const holdIds = parseHoldIds(req.body?.holdIds);

	if (!holdIds || holdIds.length === 0) {
		return res.status(400).json({
			message: "holdIds must be a non-empty array of positive integers",
		});
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			const holds = await tx.inventoryHold.findMany({
				where: { id: { in: holdIds } },
			});

			if (holds.length !== holdIds.length) {
				const foundIds = new Set(holds.map((h) => h.id));
				const missingIds = holdIds.filter((id) => !foundIds.has(id));
				const error = new Error("HOLD_NOT_FOUND");
				error.code = "HOLD_NOT_FOUND";
				error.missingIds = missingIds;
				throw error;
			}

			const notActiveIds = holds.filter((h) => h.status !== "ACTIVE").map((h) => h.id);
			if (notActiveIds.length > 0) {
				const error = new Error("HOLD_NOT_ACTIVE");
				error.code = "HOLD_NOT_ACTIVE";
				error.notActiveIds = notActiveIds;
				throw error;
			}

			// Stable order reduces deadlock risk.
			const holdsInOrder = [...holds].sort((a, b) => a.inventoryId - b.inventoryId);
			const inventoriesById = new Map();
			const releasedHolds = [];

			for (const hold of holdsInOrder) {
				const released = await tx.inventoryHold.updateMany({
					where: { id: hold.id, status: "ACTIVE" },
					data: { status: "RELEASED" },
				});

				if (released.count === 0) {
					const error = new Error("HOLD_NOT_ACTIVE");
					error.code = "HOLD_NOT_ACTIVE";
					error.notActiveIds = [hold.id];
					throw error;
				}

				const inventory = await tx.eventInventory.update({
					where: { id: hold.inventoryId },
					data: {
						availableQuantity: { increment: hold.quantity },
						reservedQuantity: { decrement: hold.quantity },
					},
				});

				inventoriesById.set(inventory.id, inventory);
				releasedHolds.push({
					holdId: hold.id,
					status: "RELEASED",
					expiresAt: hold.expiresAt,
					inventoryId: hold.inventoryId,
					ticketTypeId: hold.ticketTypeId,
					quantity: hold.quantity,
				});
			}

			// Return in the same order as input for convenience.
			const releasedById = new Map(releasedHolds.map((h) => [h.holdId, h]));
			const ordered = holdIds.map((id) => releasedById.get(id));

			return {
				holds: ordered,
				inventories: Array.from(inventoriesById.values()),
			};
		});

		return res.status(200).json({
			releasedCount: result.holds.length,
			holds: result.holds.map((h) => ({
				holdId: h.holdId,
				status: h.status,
				expiresAt: h.expiresAt,
				ticketTypeId: h.ticketTypeId,
				quantity: h.quantity,
				inventoryId: h.inventoryId,
			})),
		});
	} catch (error) {
		if (error?.code === "HOLD_NOT_FOUND") {
			return res.status(404).json({
				message: "One or more inventory holds not found",
				missingHoldIds: error.missingIds,
			});
		}

		if (error?.code === "HOLD_NOT_ACTIVE") {
			return res.status(409).json({
				message: "One or more inventory holds are not ACTIVE",
				notActiveHoldIds: error.notActiveIds,
			});
		}

		console.error("Failed to release inventory holds", error);
		return res.status(500).json({ message: "Failed to release inventory holds" });
	}
};
