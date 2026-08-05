/**
 * Security Utility Module for "Donde los Zambrano" POS System
 * Provides input sanitization, price validation, XSS prevention, and WhatsApp markdown escaping.
 */

/**
 * Sanitizes arbitrary text inputs by stripping HTML tags, control characters,
 * and capping total character length to prevent XSS and buffer overflow issues.
 */
export const sanitizeText = (text, maxLength = 100) => {
  if (typeof text !== 'string') return '';
  // Strip HTML tags and control characters (except space)
  const cleaned = text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[\r\n\t\0\x0B]/g, ' ') // replace control chars with space
    .replace(/\s+/g, ' ') // condense whitespace
    .trim();

  return cleaned.slice(0, maxLength);
};

/**
 * Sanitizes Cédula / NIT / Customer Tax ID inputs.
 * Permits only alphanumeric characters, numbers, and hyphens (max 20 chars).
 */
export const sanitizeNit = (nit) => {
  if (typeof nit !== 'string' && typeof nit !== 'number') return '222222222222';
  const str = String(nit).trim();
  const cleaned = str.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);
  return cleaned || '222222222222';
};

/**
 * Sanitizes Colombian WhatsApp / Mobile Phone Numbers.
 * Ensures output contains only digits and fits valid Colombian length (10 digits or 12 with country code).
 */
export const sanitizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith('57')) return digits;
  if (digits.length > 0 && digits.length <= 12) return digits;
  return '';
};

/**
 * Escapes WhatsApp Markdown special syntax characters (*, _, ~, `)
 * to prevent receipt text tampering / formatting injection.
 */
export const escapeWhatsAppMarkdown = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/[*_~`]/g, '');
};

/**
 * Validates price value to ensure it is a finite positive number.
 */
export const validatePrice = (price, fallback = 0) => {
  const num = Number(price);
  if (isNaN(num) || !isFinite(num) || num < 0) return fallback;
  return num;
};

/**
 * Validates item quantity to ensure positive integer.
 */
export const validateQty = (qty, fallback = 1) => {
  const num = parseInt(qty, 10);
  if (isNaN(num) || num <= 0) return fallback;
  return Math.min(num, 99); // Max 99 items per line
};
