/**
 * src/utils/cryptoUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidades criptográficas seguras basadas en Web Crypto API (SHA-256 + Salt).
 * Las contraseñas nunca se transmiten ni almacenan en texto plano en la BD.
 */

const APP_PEPPER = 'ZAMBRANO_POS_SECURE_PEPPER_2026_!#';

/**
 * Convierte un ArrayBuffer a cadena hexadecimal.
 */
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Genera un Hash criptográfico SHA-256 para una contraseña.
 * @param {string} password Contraseña en texto plano
 * @param {string} [customSalt] Salt opcional
 * @returns {Promise<string>} Hash SHA-256 en formato hexadecimal
 */
export const hashPassword = async (password, customSalt = '') => {
  const cleanPass = (password || '').trim();
  if (!cleanPass) return '';

  const saltedString = `${APP_PEPPER}::${customSalt}::${cleanPass}::${APP_PEPPER}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
};

/**
 * Verifica si una contraseña ingresada coincide con un hash almacenado.
 * Soporta migración transparente si la contraseña antigua estaba en texto plano.
 * @param {string} inputPassword Contraseña ingresada
 * @param {string} storedHash Hash guardado en Firestore (o clave legacy)
 * @param {string} [customSalt] Salt usado
 * @returns {Promise<boolean>} True si coincide
 */
export const verifyPassword = async (inputPassword, storedHash, customSalt = '') => {
  const cleanInput = (inputPassword || '').trim();
  if (!cleanInput || !storedHash) return false;

  // 1. Verificar contra hash SHA-256
  const inputHash = await hashPassword(cleanInput, customSalt);
  if (inputHash === storedHash) {
    return true;
  }

  // 2. Soporte de migración: Si en Firestore aún estaba en texto plano, comparar directamente
  // (esto permite que el usuario actualice su clave vieja sin quedar bloqueado)
  if (cleanInput === storedHash) {
    return true;
  }

  return false;
};
