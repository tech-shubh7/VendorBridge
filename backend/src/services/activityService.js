import db from '../models/index.js';
import STATUS_CODES from '../config/constants.js';
import AppError from '../utils/appError.js';

const activityService = {
  async getActivities(query) {
    const { page = 1, limit = 20, entity_type } = query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (entity_type) {
      where.entity_type = entity_type;
    }

    const { count, rows } = await db.ActivityLog.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
      include: [
        { model: db.User, attributes: ['name', 'email', 'role'] }
      ]
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit)
    };
  }
};

export default activityService;
