'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `CREATE TYPE "vendor_status_enum" AS ENUM('active', 'inactive', 'blacklisted');`
    ).catch(() => { }); // ignore if already exists

    await queryInterface.addColumn('vendors', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'blacklisted'),
      defaultValue: 'active',
      allowNull: false,
      after: 'rating'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('vendors', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "vendor_status_enum";');
  }
};
