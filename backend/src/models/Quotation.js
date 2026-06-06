import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Quotation extends Model {
    static associate(models) {
      this.belongsTo(models.Rfq, { foreignKey: 'rfq_id' });
      this.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
      this.belongsTo(models.User, { foreignKey: 'user_id' });
      this.hasMany(models.QuotationItem, { foreignKey: 'quotation_id', onDelete: 'CASCADE', hooks: true });
      this.hasOne(models.Approval, { foreignKey: 'quotation_id', onDelete: 'CASCADE', hooks: true });
      this.hasOne(models.PurchaseOrder, { foreignKey: 'quotation_id', onDelete: 'CASCADE', hooks: true });
    }
  }
  Quotation.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    quotation_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    rfq_id: { type: DataTypes.UUID, allowNull: false },
    vendor_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID },
    status: { type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected'), defaultValue: 'draft' },
    delivery_days: { type: DataTypes.INTEGER },
    payment_terms: { type: DataTypes.TEXT },
    valid_until: { type: DataTypes.DATEONLY },
    notes: { type: DataTypes.TEXT },
    total_amount: { type: DataTypes.DECIMAL(14, 2) },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
    submitted_at: { type: DataTypes.DATE }
  }, { sequelize, modelName: 'Quotation', tableName: 'quotations', timestamps: true, underscored: true });
  return Quotation;
};