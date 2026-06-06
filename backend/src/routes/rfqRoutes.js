import express from 'express';
import { createRfq, getRfqs, getRfqById, publishRfq, closeRfq } from '../controllers/rfqController.js';
import { getRfqQuotations, compareQuotations } from '../controllers/quotationController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createRfq);
router.get('/', getRfqs);
router.get('/:id', getRfqById);
router.patch('/:id/publish', publishRfq);
router.patch('/:id/close', closeRfq);

// Nested routes for quotations
router.get('/:rfqId/quotations', getRfqQuotations);
router.get('/:rfqId/quotations/compare', compareQuotations);

export default router;
