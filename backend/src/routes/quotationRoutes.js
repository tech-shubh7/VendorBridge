import express from 'express';
import {
  createQuotation,
  updateQuotation,
  submitQuotation,
  getQuotations,
  getQuotationById,
  getMyRfqs
} from '../controllers/quotationController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { createQuotationSchema, updateQuotationStatusSchema } from '../validations/quotationValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-rfqs', getMyRfqs);          // Vendor portal: GET /quotations/my-rfqs?vendor_id=...
router.post('/', validate(createQuotationSchema), createQuotation);
router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', validate(createQuotationSchema), updateQuotation);
router.patch('/:id/submit', validate(updateQuotationStatusSchema), submitQuotation);

export default router;
