import express from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  sendPurchaseOrder
} from '../controllers/poController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { createPoSchema, updatePoSchema } from '../validations/poValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createPoSchema), createPurchaseOrder);
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.put('/:id', validate(updatePoSchema), updatePurchaseOrder);
router.patch('/:id/send', sendPurchaseOrder);

export default router;
