import { Router } from "express";
import { createTickets, getTickets } from "../controllers/ticketsController.js";

const ticketsRouter = Router();

ticketsRouter.post("/", createTickets);
ticketsRouter.get("/", getTickets);

export default ticketsRouter;
