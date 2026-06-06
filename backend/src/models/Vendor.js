import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Vendor extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id' });
      this.hasMany(models.RfqVendor, { foreignKey: 'vendor_id', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.Quotation, { foreignKey: 'vendor_id', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.PurchaseOrder, { foreignKey: 'vendor_id', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.Invoice, { foreignKey: 'vendor_id', onDelete: 'CASCADE', hooks: true });
    }
  }
  Vendor.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_name: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(100) },
    contact_person: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    gst_number: { type: DataTypes.STRING(15) },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING(100) },
    state: { type: DataTypes.STRING(100) },
    rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0.0 },
    notes: { type: DataTypes.TEXT },
    user_id: { type: DataTypes.UUID }
  }, { sequelize, modelName: 'Vendor', tableName: 'vendors', timestamps: true, paranoid: true, underscored: true });
  return Vendor;
};
