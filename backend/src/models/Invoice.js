
      import { Model } from 'sequelize';
      export default (sequelize, DataTypes) => {
        class Invoice extends Model {
          static associate(models) {
            this.belongsTo(models.PurchaseOrder, { foreignKey: 'po_id' });
            this.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
            this.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
          }
        }
        Invoice.init({
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          invoice_number: { type: DataTypes.STRING(50), unique: true, allowNull: false },
          po_id: { type: DataTypes.UUID, allowNull: false },
          vendor_id: { type: DataTypes.UUID, allowNull: false },
          status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'), defaultValue: 'draft' },
          issue_date: { type: DataTypes.DATEONLY, allowNull: false },
          due_date: { type: DataTypes.DATEONLY, allowNull: false },
          subtotal: { type: DataTypes.DECIMAL(14, 2) },
          cgst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
          sgst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
          igst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
          total_amount: { type: DataTypes.DECIMAL(14, 2) },
          amount_in_words: { type: DataTypes.TEXT },
          payment_terms: { type: DataTypes.TEXT },
          notes: { type: DataTypes.TEXT },
          pdf_url: { type: DataTypes.TEXT },
          sent_at: { type: DataTypes.DATE },
          sent_to_email: { type: DataTypes.STRING(255) },
          created_by: { type: DataTypes.UUID }
        }, { sequelize, modelName: 'Invoice', tableName: 'invoices', timestamps: true, underscored: true });
        return Invoice;
      };
    