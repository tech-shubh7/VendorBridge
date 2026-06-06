import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import { sendRfqInvitationEmail } from '../utils/email.js';
import logger from '../config/logger.js';
import STATUS_CODES from '../config/constants.js';
/**
 * Creates a new RFQ as draft
 */
export const createRfq = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const result = await rfqService.createRfq(req.body, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.CREATED,
      message: 'RFQ created successfully',
      data: result
    });
  } catch (error) {
    logger.error(`createRfq error: ${error.message}`);
    next(error);
  }
};

/**
 * Lists RFQs with optional status filter
 */
export const getRfqs = async (req, res, next) => {
  try {
    const result = await rfqService.getRfqs(req.query);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'RFQs fetched successfully',
      data: result.rows,
      pagination: {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        total: result.count,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error(`getRfqs error: ${error.message}`);
    next(error);
  }
};

/**
 * Gets detail of a specific RFQ
 */
export const getRfqById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await rfqService.getRfqById(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'RFQ details fetched successfully',
      data: {
        rfq: result.rfq,
        quotation_count: result.quotation_count
      }
    });
  } catch (error) {
    logger.error(`getRfqById error: ${error.message}`);
    next(error);
  }
};

/**
 * Publishes a draft RFQ
 */
export const publishRfq = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const result = await rfqService.publishRfq(id, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'RFQ published successfully',
      data: result
    });
  } catch (error) {
    logger.error(`publishRfq error: ${error.message}`);
    next(error);
  }
};

/**
 * Closes an open RFQ
 */
export const closeRfq = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const result = await rfqService.closeRfq(id, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'RFQ closed successfully',
      data: result
    });
  } catch (error) {
    logger.error(`closeRfq error: ${error.message}`);
    next(error);
  }
};
