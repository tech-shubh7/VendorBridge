import express from 'express';
import * as VendorController from '../controllers/vendorController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// List vendors
router.get('/', VendorController.listVendors);

// IMPORTANT: specific paths before parameterised ones
router.get('/categories', VendorController.getVendorCategories);

// Sub-routes
router.get('/:id/rfqs', VendorController.getVendorRfqs);
router.get('/:id/quotations', VendorController.getVendorQuotations);
router.get('/:id/pos', VendorController.getVendorPos);

export default router;
