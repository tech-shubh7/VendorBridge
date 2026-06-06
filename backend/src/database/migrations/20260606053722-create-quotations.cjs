'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('quotations', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        quotation_number: { type: Sequelize.STRING(50), unique: true, allowNull: false },
        rfq_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'rfqs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        vendor_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vendors', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        status: { type: Sequelize.ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected'), defaultValue: 'draft' },
        delivery_days: { type: Sequelize.INTEGER },
        payment_terms: { type: Sequelize.TEXT },
        valid_until: { type: Sequelize.DATEONLY },
        notes: { type: Sequelize.TEXT },
        total_amount: { type: Sequelize.DECIMAL(14, 2) },
        currency: { type: Sequelize.STRING(10), defaultValue: 'INR' },
        submitted_at: { type: Sequelize.DATE },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
      });
    },
  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('quotations');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quotations_status";');
    }
};
