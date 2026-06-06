import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import vendorService from '../services/vendorService.js';
import { successResponse } from '../utils/response.js';

// ─── Distinct categories for filter dropdown ─────────────────────────────────
export const getVendorCategories = async (req, res, next) => {
  try {
    const categories = await vendorService.getVendorCategories();

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: "Vendor categories fetched successfully.",
      data: categories
    });
  } catch (error) {
    logger.error(`getVendorCategories error: ${error.message}`);
    next(error);
  }
};

// ─── Sub-routes ───────────────────────────────────────────────────────────────

export const getVendorRfqs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rfqs = await vendorService.getVendorRfqs(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: "Vendor RFQs fetched successfully.",
      data: rfqs
    });
  } catch (error) {
    logger.error(`getVendorRfqs error: ${error.message}`);
    next(error);
  }
};

export const getVendorQuotations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotations = await vendorService.getVendorQuotations(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: "Vendor quotations fetched successfully.",
      data: quotations
    });
  } catch (error) {
    logger.error(`getVendorQuotations error: ${error.message}`);
    next(error);
  }
};

export const getVendorPos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pos = await vendorService.getVendorPos(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: "Vendor purchase orders fetched successfully.",
      data: pos
    });
  } catch (error) {
    logger.error(`getVendorPos error: ${error.message}`);
    next(error);
  }
};
