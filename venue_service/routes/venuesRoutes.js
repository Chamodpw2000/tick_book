import { Router } from "express";
import { createVenue, getVenues, getVenueById } from "../controllers/venuesController.js";

const venuesRouter = Router();

venuesRouter.post("/", createVenue);
venuesRouter.get("/", getVenues);
venuesRouter.get("/:id", getVenueById);

export default venuesRouter;