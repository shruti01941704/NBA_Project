const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and populate assignedCriteria
      req.user = await User.findById(decoded.id).select('-password').populate('assignedCriteria');
      req.user.school = decoded.schoolId;
      req.user.role = decoded.role; // Explicitly add role from token

      next();
    } catch (error) {
      console.error(error);
      // Check if token is expired
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired. Please login again.');
      }
      // Check if token is invalid
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token. Please login again.');
      }
      // Other errors
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };
