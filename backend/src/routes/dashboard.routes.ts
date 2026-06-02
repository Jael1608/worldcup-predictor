import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";
export const dashboardRoutes = Router();
dashboardRoutes.get("/standings", controller.standings);
dashboardRoutes.get("/my-summary", controller.summary);
dashboardRoutes.get("/history", controller.history);
