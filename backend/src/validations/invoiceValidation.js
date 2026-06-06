import Joi from 'joi';
import { INVOICE_STATUS } from '../enums/statusEnums.js';

export const createInvoiceSchema = Joi.object({
  po_id: Joi.string().uuid().required(),
  issue_date: Joi.date().iso().required(),
  due_date: Joi.date().iso().min(Joi.ref('issue_date')).required(),
  cgst_percent: Joi.number().min(0).max(100).optional().default(0),
  sgst_percent: Joi.number().min(0).max(100).optional().default(0),
  igst_percent: Joi.number().min(0).max(100).optional().default(0),
  payment_terms: Joi.string().trim().optional().allow(""),
  notes: Joi.string().trim().optional().allow("")
});

export const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(INVOICE_STATUS)).required()
});
