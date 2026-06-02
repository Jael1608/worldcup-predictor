import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
export const authRoutes = Router();
authRoutes.post("/login", controller.login);
authRoutes.get("/me", authMiddleware, controller.me);
