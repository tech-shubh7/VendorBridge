import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  downloadInvoicePdf,
  sendInvoiceByEmail
} from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.patch('/:id/status', updateInvoiceStatus);
router.get('/:id/pdf', downloadInvoicePdf);
router.post('/:id/send-email', sendInvoiceByEmail);

export default router;
