import express from 'express';
import * as QuotationController from '../controllers/quotationController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-rfqs', QuotationController.getMyRfqs);          // Vendor portal: GET /quotations/my-rfqs?vendor_id=...
router.post('/', QuotationController.createQuotation);
router.get('/', QuotationController.getQuotations);
router.get('/:id', QuotationController.getQuotationById);
router.put('/:id', QuotationController.updateQuotation);
router.patch('/:id/submit', QuotationController.submitQuotation);

export default router;
