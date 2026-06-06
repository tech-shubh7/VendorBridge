import Joi from 'joi';
import { QUOTATION_STATUS } from '../enums/statusEnums.js';

export const createQuotationSchema = Joi.object({
  rfq_id: Joi.string().uuid().required(),
  vendor_id: Joi.string().uuid().optional(),
  delivery_days: Joi.number().integer().min(1).optional(),
  payment_terms: Joi.string().trim().optional().allow(""),
  valid_until: Joi.date().iso().greater('now').optional(),
  notes: Joi.string().trim().optional().allow(""),
  items: Joi.array().items(
    Joi.object({
      rfq_item_id: Joi.string().uuid().required(),
      unit_price: Joi.number().positive().required(),
      quantity: Joi.number().positive().required(),
      tax_percent: Joi.number().min(0).max(100).optional(),
      delivery_days: Joi.number().integer().min(1).optional(),
      notes: Joi.string().trim().optional().allow("")
    })
  ).min(1).required()
});

export const updateQuotationStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(QUOTATION_STATUS)).required()
});
