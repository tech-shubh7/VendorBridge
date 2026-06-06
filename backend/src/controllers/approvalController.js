import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import approvalService from '../services/approvalService.js';
import { successResponse } from '../utils/response.js';

/**
 * Initiates an approval for a quotation
 */
export const initiateApproval = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const result = await approvalService.initiateApproval(req.body, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.CREATED,
      message: 'Approval initiated successfully',
      data: result
    });
  } catch (error) {
    logger.error(`initiateApproval error: ${error.message}`);
    next(error);
  }
};

/**
 * List approvals
 */
export const getApprovals = async (req, res, next) => {
  try {
    const approvals = await approvalService.getApprovals();

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: "Approvals queue fetched successfully.",
      data: approvals
    });
  } catch (error) {
    logger.error(`getApprovals error: ${error.message}`);
    next(error);
  }
};

/**
 * Get approval detail
 */
export const getApprovalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await approvalService.getApprovalById(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: "Approval details fetched successfully.",
      data: result
    });
  } catch (error) {
    logger.error(`getApprovalById error: ${error.message}`);
    next(error);
  }
};

/**
 * Manager approves the quotation
 */
export const approveQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user.user_id;

    const result = await approvalService.approveQuotation(id, remarks, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: result.message
    });
  } catch (error) {
    logger.error(`approveQuotation error: ${error.message}`);
    next(error);
  }
};

/**
 * Manager rejects the quotation
 */
export const rejectQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user.user_id;

    const result = await approvalService.rejectQuotation(id, remarks, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: result.message
    });
  } catch (error) {
    logger.error(`rejectQuotation error: ${error.message}`);
    next(error);
  }
};
