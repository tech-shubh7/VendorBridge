import Joi from 'joi';
import { VENDOR_STATUS } from '../enums/statusEnums.js';

export const createVendorSchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(255).required(),
  contact_person: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string().trim().pattern(/^\+?[\d\s\-().]{7,20}$/).optional().allow(""),
  category: Joi.string().trim().max(100).required(),
  gst_number: Joi.string().trim().uppercase().pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/).optional().allow(""),
  address: Joi.string().trim().max(1000).optional().allow(""),
  city: Joi.string().trim().max(100).optional().allow(""),
  state: Joi.string().trim().max(100).optional().allow(""),
  notes: Joi.string().trim().max(2000).optional().allow("")
});

export const updateVendorSchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(255).optional(),
  contact_person: Joi.string().trim().min(2).max(255).optional(),
  email: Joi.string().trim().email().lowercase().optional(),
  phone: Joi.string().trim().pattern(/^\+?[\d\s\-().]{7,20}$/).optional().allow(""),
  category: Joi.string().trim().max(100).optional(),
  gst_number: Joi.string().trim().uppercase().pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/).optional().allow(""),
  address: Joi.string().trim().max(1000).optional().allow(""),
  city: Joi.string().trim().max(100).optional().allow(""),
  state: Joi.string().trim().max(100).optional().allow(""),
  notes: Joi.string().trim().max(2000).optional().allow("")
});

export const updateVendorStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(VENDOR_STATUS)).required()
});
