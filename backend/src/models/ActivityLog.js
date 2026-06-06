
      import { Model } from 'sequelize';
      export default (sequelize, DataTypes) => {
        class ActivityLog extends Model {
          static associate(models) {
            this.belongsTo(models.User, { as: 'performer', foreignKey: 'performed_by' });
          }
        }
        ActivityLog.init({
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          entity_type: { type: DataTypes.STRING(50), allowNull: false },
          entity_id: { type: DataTypes.UUID, allowNull: false },
          action: { type: DataTypes.STRING(100), allowNull: false },
          description: { type: DataTypes.TEXT },
          performed_by: { type: DataTypes.UUID },
          metadata: { type: DataTypes.JSONB }
        }, { sequelize, modelName: 'ActivityLog', tableName: 'activity_logs', timestamps: true, createdAt: 'created_at', updatedAt: false, underscored: true });
        return ActivityLog;
      };
    