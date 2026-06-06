
      import { Model } from 'sequelize';
      export default (sequelize, DataTypes) => {
        class RfqVendor extends Model {
          static associate(models) {
            this.belongsTo(models.Rfq, { foreignKey: 'rfq_id' });
            this.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
          }
        }
        RfqVendor.init({
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          rfq_id: { type: DataTypes.UUID, allowNull: false },
          vendor_id: { type: DataTypes.UUID, allowNull: false },
          invited_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
          invitation_sent: { type: DataTypes.BOOLEAN, defaultValue: false }
        }, { sequelize, modelName: 'RfqVendor', tableName: 'rfq_vendors', timestamps: false, underscored: true });
        return RfqVendor;
      };
    