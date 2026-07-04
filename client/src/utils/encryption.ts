/**
 * Encryption utility for secure data handling
 * Using AES-256 encryption with crypto-js
 */

import CryptoJS from 'crypto-js';

// Secret key - in production, this should come from environment
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key-change-in-production';

/**
 * Encrypt data
 */
export const encrypt = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

/**
 * Decrypt data
 */
export const decrypt = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

/**
 * Hash data (one-way)
 */
export const hash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Encrypt object
 */
export const encryptObject = <T>(obj: T): string => {
  return encrypt(JSON.stringify(obj));
};

/**
 * Decrypt object
 */
export const decryptObject = <T>(encryptedData: string): T | null => {
  try {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Generate HMAC for data integrity
 */
export const generateHMAC = (data: string, secret: string = SECRET_KEY): string => {
  return CryptoJS.HmacSHA256(data, secret).toString();
};
