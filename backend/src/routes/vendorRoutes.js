import express from 'express';
import {
  getVendorCategories,
  getVendorPos,
  getVendorQuotations,
  getVendorRfqs
} from '../controllers/vendorController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { createVendorSchema, updateVendorSchema, updateVendorStatusSchema } from '../validations/vendorValidation.js';

const router = express.Router();

router.use(authenticate);

// IMPORTANT: specific paths before parameterised ones
router.get('/categories', getVendorCategories);

// Sub-routes
router.get('/:id/rfqs', getVendorRfqs);
router.get('/:id/quotations', getVendorQuotations);
router.get('/:id/pos', getVendorPos);

export default router;
