
      import { Model } from 'sequelize';
      export default (sequelize, DataTypes) => {
        class QuotationItem extends Model {
          static associate(models) {
            this.belongsTo(models.Quotation, { foreignKey: 'quotation_id' });
            this.belongsTo(models.RfqItem, { foreignKey: 'rfq_item_id' });
          }
        }
        QuotationItem.init({
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          quotation_id: { type: DataTypes.UUID, allowNull: false },
          rfq_item_id: { type: DataTypes.UUID },
          item_name: { type: DataTypes.STRING(255), allowNull: false },
          quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
          unit: { type: DataTypes.STRING(50) },
          unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
          tax_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.0 },
          tax_amount: { type: DataTypes.DECIMAL(12, 2) },
          total_price: { type: DataTypes.DECIMAL(14, 2) },
          delivery_days: { type: DataTypes.INTEGER },
          notes: { type: DataTypes.TEXT }
        }, { sequelize, modelName: 'QuotationItem', tableName: 'quotation_items', timestamps: false, underscored: true });
        return QuotationItem;
      };
    