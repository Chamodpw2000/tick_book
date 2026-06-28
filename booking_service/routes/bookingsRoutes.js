import { Router } from "express";
import {
  createBooking,
  createBookingWithItems,
  checkPaymentAvailability,
  confirmBooking,
  getBookingById,
  getBookingDetails,
  getBookings,
  startCreateBookingSaga,
  expireStalePendingBookings,
} from "../controllers/bookingsController.js";
import { cancelBooking, revertBookingToPending } from "../controllers/bookingCompensationController.js";

const bookingsRouter = Router();
// Confirm booking after payment succeeds.
bookingsRouter.patch("/:bookingId/confirm", confirmBooking);
// Expire stale PENDING bookings (created within 1 h, unpaid for > 15 min).
bookingsRouter.patch("/expire-stale", expireStalePendingBookings);
bookingsRouter.post("/", createBooking);
bookingsRouter.post("/with-items", createBookingWithItems);
// SAGA: create booking + reserve inventory (Step Functions).
bookingsRouter.post("/saga", startCreateBookingSaga);
bookingsRouter.get("/", getBookings);
bookingsRouter.get("/:bookingId/payment-availability", checkPaymentAvailability);
bookingsRouter.get("/:bookingId", getBookingById);
bookingsRouter.get("/:bookingId/details", getBookingDetails);




// Compensation endpoint (SAGA): cancel booking if later steps fail.
bookingsRouter.patch("/:bookingId/cancel", cancelBooking);

// Compensation endpoint (SAGA): revert booking to PENDING if later steps fail.
bookingsRouter.patch("/:bookingId/revert-pending", revertBookingToPending);

export default bookingsRouter;
