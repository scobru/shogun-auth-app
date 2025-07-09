/**
 * Utility functions for string manipulation and data validation
 */

/**
 * Checks if a string is a valid email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generates a consistent hash from a string
 * Used for generating deterministic IDs
 * @param {string} str - The string to hash
 * @returns {string} - The hashed string
 */
export const hashString = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Normalizes an email address for consistent ID generation
 * Removes dots and anything after + in the local part
 * @param {string} email - The email to normalize
 * @returns {string} - The normalized email
 */
export const normalizeEmail = (email) => {
  if (!email || !isValidEmail(email)) return email;
  
  const [localPart, domain] = email.split('@');
  // Remove dots and anything after + in the local part
  const normalizedLocalPart = localPart
    .replace(/\./g, '')
    .split('+')[0];
    
  return `${normalizedLocalPart}@${domain}`;
};

/**
 * Generates a consistent user ID from an email
 * @param {string} email - The email to generate an ID from
 * @returns {string} - The generated user ID
 */
export const generateUserIdFromEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return `user_${hashString(normalizedEmail)}`;
};

export const truncate = (str, length) => {
  if (!str) {
    return "";
  }
  if (str.length <= length) {
    return str;
  }
  return `${str.substring(0, length)}...`;
}; 