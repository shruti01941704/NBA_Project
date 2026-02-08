const express = require('express');
const { getSchoolById } = require('../controllers/schoolController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/:id').get(protect, getSchoolById);

module.exports = router;
