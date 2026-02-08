const asyncHandler = require('express-async-handler');
const School = require('../models/School');

// @desc    Get school details by ID
// @route   GET /api/schools/:id
// @access  Private
const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).populate('admin', 'name email');

  if (school) {
    res.json(school);
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

module.exports = { getSchoolById };
