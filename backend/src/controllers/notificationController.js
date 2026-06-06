import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import notificationService from '../services/notificationService.js';
import { successResponse } from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const result = await notificationService.getNotifications(userId, req.query);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Notifications fetched successfully',
      data: result.rows,
      pagination: {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        total: result.count,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error(`getNotifications error: ${error.message}`);
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const result = await notificationService.markAsRead(id, userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Notification marked as read',
      data: result
    });
  } catch (error) {
    logger.error(`markAsRead error: ${error.message}`);
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const result = await notificationService.markAllAsRead(userId);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'All notifications marked as read',
      data: result
    });
  } catch (error) {
    logger.error(`markAllAsRead error: ${error.message}`);
    next(error);
  }
};
