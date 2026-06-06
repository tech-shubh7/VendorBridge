'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    // Check if admin already exists
    const adminExists = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@vendorbridge.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (adminExists.length === 0) {
      await queryInterface.bulkInsert('users', [
        {
          id: Sequelize.fn('gen_random_uuid'),
          name: 'Super Admin',
          email: 'admin@vendorbridge.com',
          password: hashedPassword,
          role: 'admin',
          status: 'approved',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'admin@vendorbridge.com' }, {});
  }
};
