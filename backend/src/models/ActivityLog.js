import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class ActivityLog extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  ActivityLog.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT },
    user_id: { type: DataTypes.UUID },
    metadata: { type: DataTypes.JSONB }
  }, { 
    sequelize, 
    modelName: 'ActivityLog', 
    tableName: 'activity_logs', 
    timestamps: true, 
    createdAt: 'created_at', 
    updatedAt: false, 
    underscored: true,
    hooks: {
      afterCreate: async (activity, options) => {
        try {
          // Find admins and managers to notify
          const usersToNotify = await sequelize.models.User.findAll({
            where: {
              role: ['admin', 'manager', 'procurement_officer'],
              is_active: true
            },
            attributes: ['id']
          });

          const notifications = usersToNotify.map(user => ({
            user_id: user.id,
            type: activity.entity_type, // 'rfq', 'po', etc
            title: `New ${activity.entity_type.toUpperCase()} Activity`,
            message: activity.description,
            entity_type: activity.entity_type,
            entity_id: activity.entity_id,
            is_read: false
          }));

          if (notifications.length > 0) {
            await sequelize.models.Notification.bulkCreate(notifications, { transaction: options.transaction });
          }
        } catch (error) {
          console.error('Failed to create notifications for activity:', error);
        }
      }
    }
  });
  return ActivityLog;
};