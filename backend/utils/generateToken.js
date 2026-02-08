const jwt = require('jsonwebtoken');

const generateToken = (id, schoolId, role) => {
  return jwt.sign({ id, schoolId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h', // Default to 24 hours, can be overridden by env var
  });
};

module.exports = generateToken;
