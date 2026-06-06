import express from "express";
import authRoutes from "./authRoutes.js";

import rfqRoutes from "./rfqRoutes.js";
import quotationRoutes from "./quotationRoutes.js";
import approvalRoutes from "./approvalRoutes.js";
import poRoutes from "./poRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import vendorRoutes from "./vendorRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);
router.use("/rfqs", rfqRoutes);
router.use("/quotations", quotationRoutes);
router.use("/approvals", approvalRoutes);
router.use("/purchase-orders", poRoutes);
router.use("/invoices", invoiceRoutes);

export default router;