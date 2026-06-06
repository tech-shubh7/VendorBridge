'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('quotation_items', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        quotation_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'quotations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        rfq_item_id: { type: Sequelize.UUID, references: { model: 'rfq_items', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        item_name: { type: Sequelize.STRING(255), allowNull: false },
        quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        unit: { type: Sequelize.STRING(50) },
        unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        tax_percent: { type: Sequelize.DECIMAL(5, 2), defaultValue: 18.0 },
        tax_amount: { type: Sequelize.DECIMAL(12, 2) },
        total_price: { type: Sequelize.DECIMAL(14, 2) },
        delivery_days: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT }
      });
    },
  async down (queryInterface, Sequelize) {await queryInterface.dropTable('quotation_items');}
};
