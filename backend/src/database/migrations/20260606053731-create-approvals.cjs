'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('approvals', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        quotation_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'quotations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        approved_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
        remarks: { type: Sequelize.TEXT },
        initiated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        acted_at: { type: Sequelize.DATE },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
      });
    },
  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('approvals');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_approvals_status";');
    }
};
