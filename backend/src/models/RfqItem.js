
      import { Model } from 'sequelize';
      export default (sequelize, DataTypes) => {
        class RfqItem extends Model {
          static associate(models) {
            this.belongsTo(models.Rfq, { foreignKey: 'rfq_id' });
          }
        }
        RfqItem.init({
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          rfq_id: { type: DataTypes.UUID, allowNull: false },
          item_name: { type: DataTypes.STRING(255), allowNull: false },
          description: { type: DataTypes.TEXT },
          quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
          unit: { type: DataTypes.STRING(50) },
          specifications: { type: DataTypes.TEXT },
          sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
        }, { sequelize, modelName: 'RfqItem', tableName: 'rfq_items', timestamps: false, underscored: true });
        return RfqItem;
      };
    