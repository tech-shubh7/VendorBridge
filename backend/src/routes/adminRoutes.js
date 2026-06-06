import express from "express";
import * as UserController from '../controllers/admin/userController.js';
import * as VendorController from '../controllers/admin/vendorController.js';
import authenticate, { authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate.js";
import { adminCreateVendorSchema, adminUpdateVendorSchema } from "../validations/adminVendorValidation.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

// Approval & Account Status 
router.patch("/users/:id/approval/:approvalStatus", UserController.manageApprovalStatus);
router.patch("/users/:id/account/:accountStatus", UserController.manageAccountStatus);

// Vendor  
router.get("/vendors", VendorController.index);
router.post("/vendors", validate(adminCreateVendorSchema), VendorController.store);
router.get("/vendors/:id", VendorController.show);
router.patch("/vendors/:id", validate(adminUpdateVendorSchema), VendorController.update);
router.delete("/vendors/:id", VendorController.destroy);



export default router;