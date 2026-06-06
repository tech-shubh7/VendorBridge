'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('purchase_orders', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        po_number: { type: Sequelize.STRING(50), unique: true, allowNull: false },
        quotation_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'quotations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        vendor_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vendors', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        status: { type: Sequelize.ENUM('draft', 'sent', 'acknowledged', 'fulfilled', 'cancelled'), defaultValue: 'draft' },
        delivery_date: { type: Sequelize.DATEONLY },
        payment_terms: { type: Sequelize.TEXT },
        terms_and_conditions: { type: Sequelize.TEXT },
        billing_address: { type: Sequelize.TEXT },
        shipping_address: { type: Sequelize.TEXT },
        subtotal: { type: Sequelize.DECIMAL(14, 2) },
        tax_amount: { type: Sequelize.DECIMAL(14, 2) },
        total_amount: { type: Sequelize.DECIMAL(14, 2) },
        currency: { type: Sequelize.STRING(10), defaultValue: 'INR' },
        notes: { type: Sequelize.TEXT },
        user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
      });
    },
  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('purchase_orders');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_purchase_orders_status";');
    }
};
