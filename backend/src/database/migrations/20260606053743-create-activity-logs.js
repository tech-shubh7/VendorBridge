'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('activity_logs', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        entity_type: { type: Sequelize.STRING(50), allowNull: false },
        entity_id: { type: Sequelize.UUID, allowNull: false },
        action: { type: Sequelize.STRING(100), allowNull: false },
        description: { type: Sequelize.TEXT },
        user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        metadata: { type: Sequelize.JSONB },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
      });
    },
  async down (queryInterface, Sequelize) {await queryInterface.dropTable('activity_logs');}
};
