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

import { validate } from '../middlewares/validate.js';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../validations/invoiceValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createInvoiceSchema), createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.patch('/:id/status', validate(updateInvoiceStatusSchema), updateInvoiceStatus);
router.get('/:id/pdf', downloadInvoicePdf);
router.post('/:id/send-email', sendInvoiceByEmail);

export default router;
