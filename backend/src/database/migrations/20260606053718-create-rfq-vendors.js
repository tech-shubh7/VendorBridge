'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('rfq_vendors', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        rfq_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'rfqs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        vendor_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vendors', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        invited_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        invitation_sent: { type: Sequelize.BOOLEAN, defaultValue: false }
      });
      await queryInterface.addConstraint('rfq_vendors', {
        fields: ['rfq_id', 'vendor_id'],
        type: 'unique',
        name: 'unique_rfq_vendor'
      });
    },
  async down (queryInterface, Sequelize) {await queryInterface.dropTable('rfq_vendors');}
};
