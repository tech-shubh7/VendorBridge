import express from "express";
import authRoutes from "./authRoutes.js";

import adminRoutes from "./adminRoutes.js";
import approvalRoutes from "./approvalRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import poRoutes from "./poRoutes.js";
import quotationRoutes from "./quotationRoutes.js";
import rfqRoutes from "./rfqRoutes.js";
import vendorRoutes from "./vendorRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);
router.use("/admins", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/rfqs", rfqRoutes);
router.use("/quotations", quotationRoutes);
router.use("/approvals", approvalRoutes);
router.use("/purchase-orders", poRoutes);
router.use("/invoices", invoiceRoutes);

export default router;