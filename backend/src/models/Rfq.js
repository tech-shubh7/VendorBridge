import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Rfq extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id' });
      this.hasMany(models.RfqItem, { foreignKey: 'rfq_id', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.RfqVendor, { foreignKey: 'rfq_id', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.Quotation, { foreignKey: 'rfq_id', onDelete: 'RESTRICT', hooks: true });
    }
  }
  Rfq.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    rfq_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    deadline: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'open', 'under_review', 'closed', 'cancelled'), defaultValue: 'draft' },
    user_id: { type: DataTypes.UUID }
  }, { sequelize, modelName: 'Rfq', tableName: 'rfqs', timestamps: true, paranoid: true, underscored: true });
  return Rfq;
};