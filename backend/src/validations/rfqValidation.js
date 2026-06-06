import Joi from 'joi';
import { RFQ_STATUS } from '../enums/statusEnums.js';

export const createRfqSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().trim().optional().allow(""),
  deadline: Joi.date().iso().greater('now').required(),
  items: Joi.array().items(
    Joi.object({
      item_name: Joi.string().trim().min(2).max(255).required(),
      description: Joi.string().trim().optional().allow(""),
      quantity: Joi.number().positive().required(),
      unit: Joi.string().trim().max(50).optional().allow(""),
      specifications: Joi.string().trim().optional().allow("")
    })
  ).min(1).required(),
  vendor_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

export const updateRfqStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(RFQ_STATUS)).required()
});
