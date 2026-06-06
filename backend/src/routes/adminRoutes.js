import express from "express";
import * as UserController from '../controllers/admin/userController.js';
import * as VendorController from '../controllers/admin/vendorController.js';
import authenticate, { authorize } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { adminCreateVendorSchema, adminUpdateVendorSchema } from "../validations/adminVendorValidation.js";
import { adminUserCreateSchema, adminUserUpdateSchema } from "../validations/adminUserValidation.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

// User CRUD
router.get("/users", UserController.index);
router.post("/users", validate(adminUserCreateSchema), UserController.store);
router.get("/users/:id", UserController.show);
router.patch("/users/:id", validate(adminUserUpdateSchema), UserController.update);
router.delete("/users/:id", UserController.destroy);

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