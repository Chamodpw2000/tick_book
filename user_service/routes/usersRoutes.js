import { Router } from "express";
import {
	createUser,
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	loginUser,
} from "../controllers/usersController.js";

const usersRouter = Router();

usersRouter.post("/", createUser);
usersRouter.get("/", getUsers);
usersRouter.get("/:id", getUserById);
usersRouter.put("/:id", updateUser);
usersRouter.delete("/:id", deleteUser);
usersRouter.post("/login", loginUser);

export default usersRouter;
