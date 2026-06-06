'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfq_items', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      rfq_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'rfqs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      item_name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      unit: { type: Sequelize.STRING(50) },
      specifications: { type: Sequelize.TEXT },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('rfq_items'); }
};
