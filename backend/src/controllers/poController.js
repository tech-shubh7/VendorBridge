import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import poService from '../services/poService.js';
import { successResponse } from '../utils/response.js';

/**
 * Generate PO from approved quotation
 */
export const createPurchaseOrder = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const result = await poService.createPurchaseOrder(req.body, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.CREATED,
      message: 'Purchase Order generated successfully',
      data: result
    });
  } catch (error) {
    logger.error(`createPurchaseOrder error: ${error.message}`);
    next(error);
  }
};

/**
 * List Purchase Orders
 */
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const pos = await poService.getPurchaseOrders();

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Purchase Orders fetched successfully',
      data: pos
    });
  } catch (error) {
    logger.error(`getPurchaseOrders error: ${error.message}`);
    next(error);
  }
};

/**
 * Get Purchase Order Detail
 */
export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await poService.getPurchaseOrderById(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Purchase Order details fetched successfully',
      data: result
    });
  } catch (error) {
    logger.error(`getPurchaseOrderById error: ${error.message}`);
    next(error);
  }
};

/**
 * Update draft PO
 */
export const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await poService.updatePurchaseOrder(id, req.body);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: result.message
    });
  } catch (error) {
    logger.error(`updatePurchaseOrder error: ${error.message}`);
    next(error);
  }
};

/**
 * Send PO to Vendor
 */
export const sendPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const result = await poService.sendPurchaseOrder(id, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Purchase Order sent to vendor',
      data: result
    });
  } catch (error) {
    logger.error(`sendPurchaseOrder error: ${error.message}`);
    next(error);
  }
};
