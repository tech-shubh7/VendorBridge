import express from 'express';
import * as RfqController from '../controllers/rfqController.js';
import * as QuotationController from '../controllers/quotationController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { createRfqSchema, updateRfqStatusSchema } from '../validations/rfqValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', RfqController.createRfq);
router.get('/', RfqController.getRfqs);
router.get('/:id', RfqController.getRfqById);
router.patch('/:id/publish', RfqController.publishRfq);
router.patch('/:id/close', RfqController.closeRfq);

// Nested routes for quotations
router.get('/:rfqId/quotations', QuotationController.getRfqQuotations);
router.get('/:rfqId/quotations/compare', QuotationController.compareQuotations);

export default router;
