import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Approval extends Model {
    static associate(models) {
      this.belongsTo(models.Quotation, { foreignKey: 'quotation_id' });
      this.belongsTo(models.User, { as: 'initiator', foreignKey: 'user_id' });
      this.belongsTo(models.User, { as: 'approver', foreignKey: 'approved_by' });
    }
  }
  Approval.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    quotation_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    approved_by: { type: DataTypes.UUID },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    remarks: { type: DataTypes.TEXT },
    initiated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    acted_at: { type: DataTypes.DATE }
  }, { sequelize, modelName: 'Approval', tableName: 'approvals', timestamps: true, underscored: true });
  return Approval;
};