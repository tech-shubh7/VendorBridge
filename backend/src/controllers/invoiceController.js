import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import invoiceService from '../services/invoiceService.js';
import { successResponse } from '../utils/response.js';

/**
 * POST /api/invoices — Generate Invoice from a sent/acknowledged PO
 */
export const createInvoice = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const result = await invoiceService.createInvoice(req.body, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.CREATED,
      message: 'Invoice generated successfully',
      data: result
    });
  } catch (error) {
    logger.error(`createInvoice error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/invoices — List all invoices
 */
export const getInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoices(req.query);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Invoices fetched successfully',
      data: result.rows,
      pagination: {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        total: result.count,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error(`getInvoices error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/invoices/:id — Invoice detail with items
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await invoiceService.getInvoiceById(id);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Invoice details fetched successfully',
      data: result
    });
  } catch (error) {
    logger.error(`getInvoiceById error: ${error.message}`);
    next(error);
  }
};

/**
 * PATCH /api/invoices/:id/status — Update invoice status
 */
export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const result = await invoiceService.updateInvoiceStatus(id, status, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: result.message
    });
  } catch (error) {
    logger.error(`updateInvoiceStatus error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/invoices/:id/pdf — Stream PDF to client
 */
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await invoiceService.getInvoicePdfBuffer(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.invoiceNumber}.pdf"`,
      'Content-Length': result.pdfBuffer.length
    });
    return res.send(result.pdfBuffer);
  } catch (error) {
    logger.error(`downloadInvoicePdf error: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/invoices/:id/send-email — Send invoice PDF via email
 */
export const sendInvoiceByEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const result = await invoiceService.sendInvoiceByEmail(id, req.body, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: result.message
    });
  } catch (error) {
    logger.error(`sendInvoiceByEmail error: ${error.message}`);
    next(error);
  }
};
