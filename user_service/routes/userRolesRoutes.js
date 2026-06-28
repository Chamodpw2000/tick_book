import { Router } from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/userRolesController.js";

const userRolesRouter = Router();

userRolesRouter.post("/", createRole);
userRolesRouter.get("/", getRoles);
userRolesRouter.get("/:id", getRoleById);
userRolesRouter.put("/:id", updateRole);
userRolesRouter.delete("/:id", deleteRole);

export default userRolesRouter;
