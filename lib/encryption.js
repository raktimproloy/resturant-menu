/**
 * Simple encryption/decryption utility for table access control
 * Note: For production, consider using a more secure encryption method
 */

// Secret key - in production, this should be stored in environment variables
const SECRET_KEY = 'restaurant-menu-secret-key-2024';

/**
 * Helper function to encode string to base64 (works in both browser and Node.js)
 */
function base64Encode(str) {
  if (typeof window === 'undefined') {
    // Node.js environment
    return Buffer.from(str).toString('base64');
  } else {
    // Browser environment
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Helper function to decode base64 string (works in both browser and Node.js)
 */
function base64Decode(str) {
  if (typeof window === 'undefined') {
    // Node.js environment
    return Buffer.from(str, 'base64').toString('utf-8');
  } else {
    // Browser environment
    return decodeURIComponent(escape(atob(str)));
  }
}

/**
 * Encrypts a string using simple encoding with secret key
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted string
 */
export function encrypt(text) {
  if (!text) return '';
  
  try {
    // Combine text with secret key
    const combined = text + SECRET_KEY;
    // Encode to base64
    const encoded = base64Encode(combined);
    // Add some obfuscation
    return encoded.split('').reverse().join('');
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Decrypts an encrypted string
 * @param {string} encrypted - Encrypted string
 * @returns {string} - Decrypted string
 */
export function decrypt(encrypted) {
  if (!encrypted) return '';
  
  try {
    // Reverse the obfuscation
    const reversed = encrypted.split('').reverse().join('');
    // Decode from base64
    const decoded = base64Decode(reversed);
    // Remove secret key
    if (decoded.endsWith(SECRET_KEY)) {
      return decoded.slice(0, -SECRET_KEY.length);
    }
    return '';
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Validates if the decrypted table number matches the expected format
 * @param {string} encryptedId - Encrypted ID from URL
 * @param {string} tableNumber - Table number from URL (e.g., "table-1")
 * @param {string} encryptedTable - Encrypted table number from URL
 * @returns {boolean} - True if validation passes
 */
export function validateTableAccess(encryptedId, tableNumber, encryptedTable) {
  try {
    // Decrypt the encrypted table number
    const decryptedTable = decrypt(encryptedTable);
    
    // Extract table number from format like "table-1" -> "1"
    const tableNum = tableNumber.replace('table-', '');
    
    // Check if decrypted table matches the table number
    if (decryptedTable !== tableNum) {
      return false;
    }
    
    // Decrypt the ID and verify it contains the table number
    const decryptedId = decrypt(encryptedId);
    if (!decryptedId || !decryptedId.includes(tableNum)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

