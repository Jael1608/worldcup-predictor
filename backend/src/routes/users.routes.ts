import { Router } from "express";
import * as controller from "../controllers/users.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
export const usersRoutes = Router();
usersRoutes.use(adminMiddleware);
usersRoutes.get("/", controller.list);
usersRoutes.post("/", controller.create);
usersRoutes.patch("/:id", controller.update);
usersRoutes.delete("/:id", controller.remove);
