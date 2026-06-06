import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import activityService from '../services/activityService.js';
import { successResponse } from '../utils/response.js';

export const getActivities = async (req, res, next) => {
  try {
    const result = await activityService.getActivities(req.query);

    return successResponse({
      res,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Activity logs fetched successfully',
      data: result.rows,
      pagination: {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        total: result.count,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error(`getActivities error: ${error.message}`);
    next(error);
  }
};
