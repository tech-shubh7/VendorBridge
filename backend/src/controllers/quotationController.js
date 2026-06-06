import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import quotationService from '../services/quotationService.js';
import { successResponse } from '../utils/response.js';

/**
 * Creates or saves a draft quotation (Vendor side)
 */
export const createQuotation = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const result = await quotationService.createQuotation(req.body, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.CREATED,
      message: 'Draft quotation saved successfully',
      data: result
    });
  } catch (error) {
    logger.error(`createQuotation error: ${error.message}`);
    next(error);
  }
};

/**
 * Updates a draft quotation
 */
export const updateQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await quotationService.updateQuotation(id, req.body);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: result.message
    });
  } catch (error) {
    logger.error(`updateQuotation error: ${error.message}`);
    next(error);
  }
};

/**
 * Submits a draft quotation (locks it)
 */
export const submitQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const result = await quotationService.submitQuotation(id, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Quotation submitted successfully',
      data: result
    });
  } catch (error) {
    logger.error(`submitQuotation error: ${error.message}`);
    next(error);
  }
};

/**
 * Vendor portal: "My RFQs" — all RFQs vendor was invited to
 */
export const getMyRfqs = async (req, res, next) => {
  try {
    const { vendor_id } = req.query; // will come from req.user.vendor_id when auth is ready
    const result = await quotationService.getMyRfqs(vendor_id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Vendor RFQs fetched successfully',
      data: result
    });
  } catch (error) {
    logger.error(`getMyRfqs error: ${error.message}`);
    next(error);
  }
};

/**
 * List quotations
 */
export const getQuotations = async (req, res, next) => {
  try {
    const quotations = await quotationService.getQuotations();

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Quotations fetched successfully',
      data: quotations
    });
  } catch (error) {
    logger.error(`getQuotations error: ${error.message}`);
    next(error);
  }
};

/**
 * Get quotation detail
 */
export const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = await quotationService.getQuotationById(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Quotation details fetched successfully',
      data: quotation
    });
  } catch (error) {
    logger.error(`getQuotationById error: ${error.message}`);
    next(error);
  }
};

/**
 * Get all quotations for a specific RFQ
 */
export const getRfqQuotations = async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    const quotations = await quotationService.getRfqQuotations(rfqId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'RFQ quotations fetched successfully',
      data: quotations
    });
  } catch (error) {
    logger.error(`getRfqQuotations error: ${error.message}`);
    next(error);
  }
};

/**
 * Compare endpoint
 */
export const compareQuotations = async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    const result = await quotationService.compareQuotations(rfqId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Quotation comparison fetched successfully',
      data: result
    });
  } catch (error) {
    logger.error(`compareQuotations error: ${error.message}`);
    next(error);
  }
};
