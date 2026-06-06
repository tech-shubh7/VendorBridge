/**
 * Converts a number to Indian words (supports Lakh, Crore)
 * e.g. 15930 → "Fifteen Thousand Nine Hundred Thirty Only"
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitWords = (n) => {
  if (n < 20) return ones[n];
  return (tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')).trim();
};

const threeDigitWords = (n) => {
  if (n === 0) return '';
  if (n < 100) return twoDigitWords(n);
  const hundred = ones[Math.floor(n / 100)] + ' Hundred';
  const rest = n % 100;
  return rest === 0 ? hundred : hundred + ' ' + twoDigitWords(rest);
};

export const amountInWords = (amount) => {
  const n = Math.floor(amount);
  if (n === 0) return 'Zero Only';

  let result = '';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) result += threeDigitWords(crore) + ' Crore ';
  if (lakh > 0) result += threeDigitWords(lakh) + ' Lakh ';
  if (thousand > 0) result += threeDigitWords(thousand) + ' Thousand ';
  if (remainder > 0) result += threeDigitWords(remainder);

  return result.trim() + ' Only';
};
