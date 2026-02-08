const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createSubmission, getMySubmissions, listSubmissions, listAssignedSubmissions, updateSubmissionStatus } = require('../controllers/submissionController');

const router = express.Router();

// Student creates a submission with multiple files under field name 'files'
router.post('/', protect, upload.array('files', 10), createSubmission);

// Student views own submissions
router.get('/mine', protect, getMySubmissions);

// Admin/Evaluator lists submissions (optionally filter by criteriaCode/status)
const evaluator = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'evaluator')) {
    next();
  } else {
    res.status(403);
    return res.json({ message: 'Access denied.' });
  }
};

router.get('/', protect, evaluator, listSubmissions);

// Admin/Evaluator updates status
router.put('/:id/status', protect, evaluator, updateSubmissionStatus);

// Faculty: list submissions for their assigned criteria
router.get('/assigned', protect, listAssignedSubmissions);

module.exports = router;
