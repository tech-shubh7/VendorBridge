import express from 'express';
import {
  getVendorCategories,
  getVendorPos,
  getVendorQuotations,
  getVendorRfqs
} from '../controllers/vendorController.js';

const router = express.Router();

// IMPORTANT: specific paths before parameterised ones
router.get('/categories', getVendorCategories);

// Sub-routes
router.get('/:id/rfqs', getVendorRfqs);
router.get('/:id/quotations', getVendorQuotations);
router.get('/:id/pos', getVendorPos);

export default router;
