const crypto = require('crypto');

const generateDeviceFingerprint = (deviceInfo) => {
  return crypto.createHash('sha256').update(deviceInfo + process.env.ENCRYPTION_KEY).digest('hex');
};

const sanitizeInput = (input) => {
  if (!input) return '';
  return input.replace(/[<>]/g, '').trim();
};

const validatePasswordStrength = (password) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      minLength: !hasMinLength,
      upperCase: !hasUpperCase,
      lowerCase: !hasLowerCase,
      numbers: !hasNumbers,
      specialChar: !hasSpecialChar
    }
  };
};

module.exports = { generateDeviceFingerprint, sanitizeInput, validatePasswordStrength };
