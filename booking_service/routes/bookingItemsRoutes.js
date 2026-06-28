import { Router } from "express";
import {
  createBookingItem,
  getBookingItems,
} from "../controllers/bookingItemsController.js";

const bookingItemsRouter = Router();

bookingItemsRouter.post("/", createBookingItem);
bookingItemsRouter.get("/", getBookingItems);

export default bookingItemsRouter;
