import express from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  sendPurchaseOrder
} from '../controllers/poController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createPurchaseOrder);
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.put('/:id', updatePurchaseOrder);
router.patch('/:id/send', sendPurchaseOrder);

export default router;
