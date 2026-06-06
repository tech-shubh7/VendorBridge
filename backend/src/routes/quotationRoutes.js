import express from 'express';
import {
  createQuotation,
  updateQuotation,
  submitQuotation,
  getQuotations,
  getQuotationById,
  getMyRfqs
} from '../controllers/quotationController.js';

const router = express.Router();

router.get('/my-rfqs', getMyRfqs);          // Vendor portal: GET /quotations/my-rfqs?vendor_id=...
router.post('/', createQuotation);
router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.patch('/:id/submit', submitQuotation);

export default router;
