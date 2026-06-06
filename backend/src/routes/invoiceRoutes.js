import express from 'express';
import * as InvoiceController from '../controllers/invoiceController.js';
import authenticate from '../middlewares/auth.js';

import { validate } from '../middlewares/validate.js';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../validations/invoiceValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', InvoiceController.createInvoice);
router.get('/', InvoiceController.getInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.patch('/:id/status', InvoiceController.updateInvoiceStatus);
router.get('/:id/pdf', InvoiceController.downloadInvoicePdf);
router.post('/:id/send-email', InvoiceController.sendInvoiceByEmail);

export default router;
