import db from '../models/index.js';
import STATUS_CODES from '../config/constants.js';
import AppError from '../utils/appError.js';

const notificationService = {
  async getNotifications(userId, query) {
    const { page = 1, limit = 20, is_read } = query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = { user_id: userId };
    
    // Default to only showing unread if not explicitly asked for read
    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    } else {
      where.is_read = false; // Only true will not be shown as per user req
    }

    const { count, rows } = await db.Notification.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']]
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit)
    };
  },

  async markAsRead(id, userId) {
    const notification = await db.Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      throw new AppError('Notification not found', STATUS_CODES.NOT_FOUND);
    }

    notification.is_read = true;
    await notification.save();

    return { status: 'read' };
  },

  async markAllAsRead(userId) {
    await db.Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
    return { status: 'all_read' };
  }
};

export default notificationService;
