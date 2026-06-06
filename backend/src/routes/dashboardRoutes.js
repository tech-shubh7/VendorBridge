import express from "express";
import * as DashboardController from "../controllers/dashboardController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", DashboardController.getDashboard);

export default router;
