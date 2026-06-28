import { Router } from "express";
import {
  createInventoryRecord,
  getHoldIdsForBooking,
  getInventoryByEvents,
} from "../controllers/inventoryController.js";
import {
  createInventoryHold,
  confirmInventoryHoldForBooking,
  getHoldsForBooking,
} from "../controllers/inventoryBookingController.js";
import {
  releaseInventoryHold,
  releaseInventoryHolds,
} from "../controllers/inventoryCompensationController.js";

const inventoryRouter = Router();

// Get inventory records by an array of event IDs
inventoryRouter.get("/events", getInventoryByEvents);

// Get an array of hold IDs for a given booking.
inventoryRouter.get("/booking/:bookingId/hold-ids", getHoldIdsForBooking);

// Create an inventory record for an event ticket type.
inventoryRouter.post("/records", createInventoryRecord);

// Create an inventory hold (reserve tickets temporarily).
inventoryRouter.post("/holds", createInventoryHold);

// Fetch all active holds for a booking.
inventoryRouter.get("/booking/:bookingId/holds", getHoldsForBooking);

// Confirm an inventory hold after booking/payment succeeds.
inventoryRouter.patch("/holds/:holdId/confirm", confirmInventoryHoldForBooking);

// Release multiple holds in one call.
inventoryRouter.patch("/holds/release", releaseInventoryHolds);

// Release an inventory hold (payment failed / cancel).
inventoryRouter.patch("/holds/:holdId/release", releaseInventoryHold);

export default inventoryRouter;
