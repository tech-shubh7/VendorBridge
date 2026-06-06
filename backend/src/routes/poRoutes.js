import express from 'express';
import * as POController from '../controllers/poController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', POController.createPurchaseOrder);
router.get('/', POController.getPurchaseOrders);
router.get('/:id', POController.getPurchaseOrderById);
router.put('/:id', POController.updatePurchaseOrder);
router.patch('/:id/send', POController.sendPurchaseOrder);

export default router;
