/**
 * Utility functions for M-PESA integration
 */

/**
 * Generate timestamp in the format required by M-PESA
 * @returns {string} Formatted timestamp
 */
const generateTimestamp = () => {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
};

/**
 * Generate password for M-PESA API
 * @param {string} timestamp - The timestamp to use in password generation
 * @returns {string} Base64 encoded password
 */
const generatePassword = (timestamp) => {
    const { BUSINESS_SHORT_CODE, PASSKEY } = process.env;
    const str = `${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`;
    return Buffer.from(str).toString('base64');
};

/**
 * Format phone number to include country code
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
    return phone.toString().replace(/^(?:254|\+254|0)/, '254');
};

module.exports = {
    generateTimestamp,
    generatePassword,
    formatPhoneNumber
};