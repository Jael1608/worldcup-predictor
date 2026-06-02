import { Router } from "express";
import * as controller from "../controllers/admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
export const adminRoutes = Router();
adminRoutes.use(adminMiddleware);
adminRoutes.post("/import-matches", controller.importMatches);
adminRoutes.post("/import-matches-json", controller.importJson);
adminRoutes.post("/recalculate-points", controller.recalculate);
