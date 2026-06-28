import { Router } from "express";
import { createArtist, getArtists, getArtistById, deleteArtist } from "../controllers/artistsController.js";

const artistsRouter = Router();

artistsRouter.post("/", createArtist);
artistsRouter.get("/", getArtists);
artistsRouter.get("/:id", getArtistById);
artistsRouter.delete("/:id", deleteArtist);

export default artistsRouter;
