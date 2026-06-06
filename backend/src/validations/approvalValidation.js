import Joi from 'joi';
import { APPROVAL_STATUS } from '../enums/statusEnums.js';

export const initiateApprovalSchema = Joi.object({
  quotation_id: Joi.string().uuid().required(),
  approver_id: Joi.string().uuid().required()
});

export const reviewApprovalSchema = Joi.object({
  remarks: Joi.string().trim().required()
});
