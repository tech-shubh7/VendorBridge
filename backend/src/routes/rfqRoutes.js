import express from 'express';
import { createRfq, getRfqs, getRfqById, publishRfq, closeRfq } from '../controllers/rfqController.js';
import { getRfqQuotations, compareQuotations } from '../controllers/quotationController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { createRfqSchema, updateRfqStatusSchema } from '../validations/rfqValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createRfqSchema), createRfq);
router.get('/', getRfqs);
router.get('/:id', getRfqById);
router.patch('/:id/publish', validate(updateRfqStatusSchema), publishRfq);
router.patch('/:id/close', validate(updateRfqStatusSchema), closeRfq);

// Nested routes for quotations
router.get('/:rfqId/quotations', getRfqQuotations);
router.get('/:rfqId/quotations/compare', compareQuotations);

export default router;
