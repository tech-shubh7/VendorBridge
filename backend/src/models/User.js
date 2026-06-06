import { Model } from 'sequelize';
import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasOne(models.Vendor, { foreignKey: 'user_id', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.Rfq, { foreignKey: 'user_id', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.Quotation, { as: 'submittedQuotations', foreignKey: 'submitted_by', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.Approval, { as: 'initiatedApprovals', foreignKey: 'user_id', onDelete: 'CASCADE', hooks: true });
      this.hasMany(models.Approval, { as: 'approvedApprovals', foreignKey: 'approved_by', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.PurchaseOrder, { foreignKey: 'user_id', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.Invoice, { foreignKey: 'user_id', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.ActivityLog, { foreignKey: 'user_id', onDelete: 'SET NULL', hooks: true });
      this.hasMany(models.Notification, { foreignKey: 'user_id', onDelete: 'CASCADE', hooks: true });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'procurement_officer', 'manager', 'vendor'),
        allowNull: false,
      },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password') && user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};
