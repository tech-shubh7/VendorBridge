import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    static associate(models) {
      this.belongsTo(models.Quotation, { foreignKey: 'quotation_id' });
      this.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
      this.belongsTo(models.User, { foreignKey: 'user_id' });
      this.hasMany(models.Invoice, { foreignKey: 'po_id', onDelete: 'CASCADE', hooks: true });
    }
  }
  PurchaseOrder.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    po_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    quotation_id: { type: DataTypes.UUID, allowNull: false },
    vendor_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'sent', 'acknowledged', 'fulfilled', 'cancelled'), defaultValue: 'draft' },
    delivery_date: { type: DataTypes.DATEONLY },
    payment_terms: { type: DataTypes.TEXT },
    terms_and_conditions: { type: DataTypes.TEXT },
    billing_address: { type: DataTypes.TEXT },
    shipping_address: { type: DataTypes.TEXT },
    subtotal: { type: DataTypes.DECIMAL(14, 2) },
    tax_amount: { type: DataTypes.DECIMAL(14, 2) },
    total_amount: { type: DataTypes.DECIMAL(14, 2) },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
    notes: { type: DataTypes.TEXT },
    user_id: { type: DataTypes.UUID }
  }, { sequelize, modelName: 'PurchaseOrder', tableName: 'purchase_orders', timestamps: true, underscored: true });
  return PurchaseOrder;
};