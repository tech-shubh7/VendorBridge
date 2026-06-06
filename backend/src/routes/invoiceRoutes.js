import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  downloadInvoicePdf,
  sendInvoiceByEmail
} from '../controllers/invoiceController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.patch('/:id/status', updateInvoiceStatus);
router.get('/:id/pdf', downloadInvoicePdf);
router.post('/:id/send-email', sendInvoiceByEmail);

export default router;
