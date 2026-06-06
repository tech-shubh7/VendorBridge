
      import { Model } from 'sequelize';
      export default (sequelize, DataTypes) => {
        class Notification extends Model {
          static associate(models) {
            this.belongsTo(models.User, { foreignKey: 'user_id' });
          }
        }
        Notification.init({
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          user_id: { type: DataTypes.UUID, allowNull: false },
          type: { type: DataTypes.STRING(100), allowNull: false },
          title: { type: DataTypes.STRING(255), allowNull: false },
          message: { type: DataTypes.TEXT },
          entity_type: { type: DataTypes.STRING(50) },
          entity_id: { type: DataTypes.UUID },
          is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
        }, { sequelize, modelName: 'Notification', tableName: 'notifications', timestamps: true, createdAt: 'created_at', updatedAt: false, underscored: true });
        return Notification;
      };
    