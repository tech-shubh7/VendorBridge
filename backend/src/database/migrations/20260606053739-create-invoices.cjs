'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('invoices', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        invoice_number: { type: Sequelize.STRING(50), unique: true, allowNull: false },
        po_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'purchase_orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        vendor_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vendors', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        status: { type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'), defaultValue: 'draft' },
        issue_date: { type: Sequelize.DATEONLY, allowNull: false },
        due_date: { type: Sequelize.DATEONLY, allowNull: false },
        subtotal: { type: Sequelize.DECIMAL(14, 2) },
        cgst_amount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
        sgst_amount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
        igst_amount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
        total_amount: { type: Sequelize.DECIMAL(14, 2) },
        amount_in_words: { type: Sequelize.TEXT },
        payment_terms: { type: Sequelize.TEXT },
        notes: { type: Sequelize.TEXT },
        pdf_url: { type: Sequelize.TEXT },
        sent_at: { type: Sequelize.DATE },
        sent_to_email: { type: Sequelize.STRING(255) },
        user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
      });
    },
  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('invoices');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_status";');
    }
};
