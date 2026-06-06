import express from 'express';
import {
  getVendors,
  getVendorCategories,
  getVendorById,
  createVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
  getVendorRfqs,
  getVendorQuotations,
  getVendorPos
} from '../controllers/vendorController.js';

const router = express.Router();

// IMPORTANT: specific paths before parameterised ones
router.get('/categories', getVendorCategories);

router.get('/', getVendors);
router.post('/', createVendor);
router.get('/:id', getVendorById);
router.put('/:id', updateVendor);
router.patch('/:id/status', updateVendorStatus);
router.delete('/:id', deleteVendor);

// Sub-routes
router.get('/:id/rfqs', getVendorRfqs);
router.get('/:id/quotations', getVendorQuotations);
router.get('/:id/pos', getVendorPos);

export default router;
