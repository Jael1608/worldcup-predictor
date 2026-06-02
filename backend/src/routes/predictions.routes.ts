import { Router } from "express";
import * as controller from "../controllers/predictions.controller";
export const predictionsRoutes = Router();
predictionsRoutes.post("/", controller.create);
predictionsRoutes.get("/me", controller.mine);
predictionsRoutes.get("/match/:matchId", controller.byMatch);
