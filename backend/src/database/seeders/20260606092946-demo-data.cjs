'use strict';
const crypto = require('crypto');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // --- Auto-cleanup dirty state if previous seed failed halfway ---
    await queryInterface.bulkDelete('invoices', null, {});
    await queryInterface.bulkDelete('purchase_orders', null, {});
    await queryInterface.bulkDelete('approvals', null, {});
    await queryInterface.bulkDelete('quotation_items', null, {});
    await queryInterface.bulkDelete('quotations', null, {});
    await queryInterface.bulkDelete('rfq_vendors', null, {});
    await queryInterface.bulkDelete('rfq_items', null, {});
    await queryInterface.bulkDelete('rfqs', null, {});
    await queryInterface.bulkDelete('vendors', null, {});
    await queryInterface.bulkDelete('users', {
      email: ['procurement@vendorbridge.com', 'manager@vendorbridge.com', 'contact@acmecorp.com']
    }, {});
    // ----------------------------------------------------------------

    const hashedPassword = await bcrypt.hash('Password@123', 12);
    const now = new Date();

    // 1. Generate UUIDs for users
    const procurementUserId = crypto.randomUUID();
    const managerUserId = crypto.randomUUID();
    const vendorUserId = crypto.randomUUID();
    
    // 2. Generate UUIDs for business entities
    const vendorId = crypto.randomUUID();
    const rfqId = crypto.randomUUID();
    const rfqItemId1 = crypto.randomUUID();
    const rfqItemId2 = crypto.randomUUID();
    const rfqVendorId = crypto.randomUUID();
    const quotationId = crypto.randomUUID();
    const quotationItemId1 = crypto.randomUUID();
    const quotationItemId2 = crypto.randomUUID();
    const approvalId = crypto.randomUUID();
    const poId = crypto.randomUUID();
    const invoiceId = crypto.randomUUID();

    // ─── USERS ──────────────────────────────────────────────────
    await queryInterface.bulkInsert('users', [
      {
        id: procurementUserId,
        name: 'John Procurement',
        email: 'procurement@vendorbridge.com',
        password: hashedPassword,
        role: 'procurement_officer',
        status: 'approved',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: managerUserId,
        name: 'Jane Manager',
        email: 'manager@vendorbridge.com',
        password: hashedPassword,
        role: 'manager',
        status: 'approved',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: vendorUserId,
        name: 'Acme Contact',
        email: 'contact@acmecorp.com',
        password: hashedPassword,
        role: 'vendor',
        status: 'approved',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ], {});

    // ─── VENDOR ─────────────────────────────────────────────────
    await queryInterface.bulkInsert('vendors', [
      {
        id: vendorId,
        user_id: vendorUserId,
        company_name: 'Acme Corp',
        category: 'Hardware',
        contact_person: 'Acme Contact',
        email: 'contact@acmecorp.com',
        phone: '1234567890',
        gst_number: '29AABCD1234E1Z5',
        address: '123 Acme St',
        city: 'Metropolis',
        state: 'NY',
        status: 'active',
        created_at: now,
        updated_at: now
      }
    ], {});

    // ─── RFQ ────────────────────────────────────────────────────
    await queryInterface.bulkInsert('rfqs', [
      {
        id: rfqId,
        rfq_number: 'RFQ-2024-0001',
        title: 'Q3 Hardware Procurement',
        description: 'Laptops and monitors for new hires.',
        status: 'open', // Setting to open so it can be quoted
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        user_id: procurementUserId,
        created_at: now,
        updated_at: now
      }
    ], {});

    // ─── RFQ ITEMS ──────────────────────────────────────────────
    await queryInterface.bulkInsert('rfq_items', [
      {
        id: rfqItemId1,
        rfq_id: rfqId,
        item_name: 'Developer Laptop',
        description: '16GB RAM, 512GB SSD',
        quantity: 10,
        unit: 'pcs'
      },
      {
        id: rfqItemId2,
        rfq_id: rfqId,
        item_name: '27-inch Monitor',
        description: '4K Resolution',
        quantity: 10,
        unit: 'pcs'
      }
    ], {});

    // ─── RFQ VENDOR LINK ────────────────────────────────────────
    await queryInterface.bulkInsert('rfq_vendors', [
      {
        id: rfqVendorId,
        rfq_id: rfqId,
        vendor_id: vendorId,
        invited_at: now,
        invitation_sent: true
      }
    ], {});

    // ─── QUOTATION ──────────────────────────────────────────────
    await queryInterface.bulkInsert('quotations', [
      {
        id: quotationId,
        quotation_number: 'QT-2024-0001',
        rfq_id: rfqId,
        vendor_id: vendorId,
        status: 'accepted', // Fully processed quotation
        total_amount: 17700.00,
        delivery_days: 14,
        payment_terms: 'Net 30',
        valid_until: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        submitted_at: now,
        created_at: now,
        updated_at: now
      }
    ], {});

    // ─── QUOTATION ITEMS ────────────────────────────────────────
    await queryInterface.bulkInsert('quotation_items', [
      {
        id: quotationItemId1,
        quotation_id: quotationId,
        rfq_item_id: rfqItemId1,
        item_name: 'Developer Laptop',
        quantity: 10,
        unit: 'pcs',
        unit_price: 1200.00,
        tax_percent: 18.00,
        tax_amount: 2160.00,
        total_price: 14160.00,
        delivery_days: 14
      },
      {
        id: quotationItemId2,
        quotation_id: quotationId,
        rfq_item_id: rfqItemId2,
        item_name: '27-inch Monitor',
        quantity: 10,
        unit: 'pcs',
        unit_price: 300.00,
        tax_percent: 18.00,
        tax_amount: 540.00,
        total_price: 3540.00,
        delivery_days: 14
      }
    ], {});

    // ─── APPROVAL ───────────────────────────────────────────────
    await queryInterface.bulkInsert('approvals', [
      {
        id: approvalId,
        quotation_id: quotationId,
        user_id: procurementUserId,
        status: 'approved',
        remarks: 'Looks good, proceeding with PO.',
        approved_by: managerUserId,
        acted_at: now,
        created_at: now,
        updated_at: now
      }
    ], {});

    // ─── PURCHASE ORDER ─────────────────────────────────────────
    await queryInterface.bulkInsert('purchase_orders', [
      {
        id: poId,
        po_number: 'PO-2024-0001',
        quotation_id: quotationId,
        vendor_id: vendorId,
        status: 'draft',
        total_amount: 17700.00,
        delivery_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        payment_terms: 'Net 30',
        terms_and_conditions: 'Standard terms apply.',
        billing_address: 'HQ Address',
        shipping_address: 'HQ Address',
        user_id: procurementUserId,
        created_at: now,
        updated_at: now
      }
    ], {});

    // ─── INVOICE ────────────────────────────────────────────────
    await queryInterface.bulkInsert('invoices', [
      {
        id: invoiceId,
        invoice_number: 'INV-2024-0001',
        po_id: poId,
        vendor_id: vendorId,
        status: 'draft',
        subtotal: 15000.00,
        cgst_amount: 1350.00,
        sgst_amount: 1350.00,
        igst_amount: 0.00,
        total_amount: 17700.00,
        issue_date: now,
        due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        user_id: procurementUserId,
        created_at: now,
        updated_at: now
      }
    ], {});

  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order to respect foreign keys
    await queryInterface.bulkDelete('invoices', null, {});
    await queryInterface.bulkDelete('purchase_orders', null, {});
    await queryInterface.bulkDelete('approvals', null, {});
    await queryInterface.bulkDelete('quotation_items', null, {});
    await queryInterface.bulkDelete('quotations', null, {});
    await queryInterface.bulkDelete('rfq_vendors', null, {});
    await queryInterface.bulkDelete('rfq_items', null, {});
    await queryInterface.bulkDelete('rfqs', null, {});
    await queryInterface.bulkDelete('vendors', null, {});
    
    // Delete only the demo users (keeping admin)
    await queryInterface.bulkDelete('users', {
      email: ['procurement@vendorbridge.com', 'manager@vendorbridge.com', 'contact@acmecorp.com']
    }, {});
  }
};
