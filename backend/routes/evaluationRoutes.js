const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCriteriaForEvaluation,
  getSubmissionsByCriteria,
  getAllSubmissions,
  getMyEvaluations,
  getEvaluation,
  getEvaluationByCriteria,
  createOrUpdateEvaluation,
  getEvaluationsSummary,
} = require('../controllers/evaluationController');
const { getEvaluationSummaryPDF } = require('../controllers/pdfController');

// Middleware to check if user is evaluator
const evaluator = (req, res, next) => {
  console.log('[EVALUATION MIDDLEWARE] Checking evaluator role. User:', req.user?._id, 'Role:', req.user?.role);
  if (req.user && req.user.role === 'evaluator') {
    next();
  } else {
    console.log('[EVALUATION MIDDLEWARE] Access denied. User role:', req.user?.role);
    res.status(403);
    return res.json({ message: 'Access denied. Evaluator role required.' });
  }
};

// IMPORTANT: Specific routes must come before parameterized routes
router.get('/criteria', protect, evaluator, getCriteriaForEvaluation);
router.get('/summary', protect, evaluator, getEvaluationsSummary);
router.get('/summary/pdf', protect, evaluator, getEvaluationSummaryPDF); // New PDF route
router.get('/submissions', protect, evaluator, getAllSubmissions);
router.get('/submissions/:criteriaId', protect, evaluator, getSubmissionsByCriteria);
// More specific routes (with 2 params) before single param route
router.get('/:criteriaId/:submissionId', protect, evaluator, getEvaluation);
router.get('/:criteriaId', protect, evaluator, getEvaluationByCriteria); // For criteria-only evaluations
router.get('/', protect, evaluator, getMyEvaluations);
router.post('/', protect, evaluator, createOrUpdateEvaluation);

module.exports = router;

