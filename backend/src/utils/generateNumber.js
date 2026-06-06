import { Op } from 'sequelize';

/**
 * Generates a sequential, formatted number (e.g. RFQ-2024-0001)
 * @param {string} prefix The prefix for the number (e.g. 'RFQ')
 * @param {object} model The Sequelize model to query
 * @param {string} field The field name to check for the latest number
 * @param {object} transaction Optional Sequelize transaction object
 * @returns {Promise<string>} The newly generated number string
 */
export const generateNumber = async (prefix, model, field, transaction = null) => {
  const currentYear = new Date().getFullYear();
  
  // Find the latest record matching the current year pattern
  const lastRecord = await model.findOne({
    where: {
      [field]: {
        [Op.like]: `${prefix}-${currentYear}-%`
      }
    },
    order: [[field, 'DESC']],
    transaction,
    paranoid: false // Also check soft-deleted records to avoid duplicates
  });

  let nextNumber = 1;
  if (lastRecord) {
    // Extract the sequence number part from something like RFQ-2024-0042
    const lastNumberStr = lastRecord[field].split('-').pop();
    nextNumber = parseInt(lastNumberStr, 10) + 1;
  }

  // Format with zero padding up to 4 digits
  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `${prefix}-${currentYear}-${paddedNumber}`;
};
