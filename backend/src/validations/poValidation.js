import Joi from 'joi';
import { PO_STATUS } from '../enums/statusEnums.js';

export const createPoSchema = Joi.object({
  quotation_id: Joi.string().uuid().required(),
  delivery_date: Joi.date().iso().greater('now').optional(),
  payment_terms: Joi.string().trim().optional().allow(""),
  terms_and_conditions: Joi.string().trim().optional().allow(""),
  billing_address: Joi.string().trim().optional().allow(""),
  shipping_address: Joi.string().trim().optional().allow(""),
  notes: Joi.string().trim().optional().allow("")
});

export const updatePoSchema = Joi.object({
  delivery_date: Joi.date().iso().greater('now').optional(),
  payment_terms: Joi.string().trim().optional().allow(""),
  terms_and_conditions: Joi.string().trim().optional().allow(""),
  billing_address: Joi.string().trim().optional().allow(""),
  shipping_address: Joi.string().trim().optional().allow(""),
  notes: Joi.string().trim().optional().allow("")
});

export const updatePoStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(PO_STATUS)).required()
});
