const asyncHandler = require('express-async-handler');
const Evaluation = require('../models/Evaluation');
const Criteria = require('../models/Criteria');
const StudentSubmission = require('../models/StudentSubmission');

// @desc    Get all criteria for evaluation
// @route   GET /api/evaluations/criteria
// @access  Private (evaluator)
const getCriteriaForEvaluation = asyncHandler(async (req, res) => {
  console.log('[EVALUATION] Fetching criteria for evaluator:', req.user._id, 'Role:', req.user.role);
  if (!req.user || req.user.role !== 'evaluator') {
    res.status(403);
    throw new Error('Access denied. Evaluator role required.');
  }
  // Get all criteria, same as admin endpoint but sorted by code
  const criterias = await Criteria.find({}).sort({ code: 1 });
  console.log('[EVALUATION] Found criteria:', criterias.length);
  if (criterias.length > 0) {
    console.log('[EVALUATION] Sample criteria:', criterias[0]);
  }
  res.json(criterias);
});

// @desc    Get submissions for a specific criteria
// @route   GET /api/evaluations/submissions/:criteriaId
// @access  Private (evaluator)
const getSubmissionsByCriteria = asyncHandler(async (req, res) => {
  const { criteriaId } = req.params;
  const submissions = await StudentSubmission.find({ criteria: criteriaId })
    .populate('student', 'name email')
    .populate('criteria', 'code name description')
    .sort({ createdAt: -1 });
  res.json(submissions);
});

// @desc    Get all submissions (for evaluator to see all)
// @route   GET /api/evaluations/submissions
// @access  Private (evaluator)
const getAllSubmissions = asyncHandler(async (req, res) => {
  const { criteriaId } = req.query;
  const filter = {};
  if (criteriaId) {
    filter.criteria = criteriaId;
  }

  const submissions = await StudentSubmission.find(filter)
    .populate('student', 'name email')
    .populate('criteria', 'code name description')
    .sort({ createdAt: -1 });
  res.json(submissions);
});

// @desc    Get evaluations by evaluator
// @route   GET /api/evaluations
// @access  Private (evaluator)
const getMyEvaluations = asyncHandler(async (req, res) => {
  const evaluations = await Evaluation.find({ evaluator: req.user._id })
    .populate('criteria', 'code name description')
    .populate('submission', 'title description student')
    .populate('submission.student', 'name email')
    .sort({ createdAt: -1 });
  res.json(evaluations);
});

// @desc    Get evaluation for specific criteria (without submission)
// @route   GET /api/evaluations/:criteriaId
// @access  Private (evaluator)
const getEvaluationByCriteria = asyncHandler(async (req, res) => {
  const { criteriaId } = req.params;
  
  const evaluation = await Evaluation.findOne({
    evaluator: req.user._id,
    criteria: criteriaId,
    $or: [
      { submission: null },
      { submission: { $exists: false } }
    ]
  })
    .populate('criteria', 'code name description');

  if (!evaluation) {
    return res.json(null);
  }
  res.json(evaluation);
});

// @desc    Get evaluation for specific criteria and submission
// @route   GET /api/evaluations/:criteriaId/:submissionId
// @access  Private (evaluator)
const getEvaluation = asyncHandler(async (req, res) => {
  const { criteriaId, submissionId } = req.params;
  
  // Handle 'null' string from route
  const subId = submissionId === 'null' ? null : submissionId;
  
  // If submissionId is null, use different query
  let query;
  if (subId === null) {
    query = {
      evaluator: req.user._id,
      criteria: criteriaId,
      $or: [
        { submission: null },
        { submission: { $exists: false } }
      ]
    };
  } else {
    query = {
      evaluator: req.user._id,
      criteria: criteriaId,
      submission: subId,
    };
  }
  
  const evaluation = await Evaluation.findOne(query)
    .populate('criteria', 'code name description')
    .populate('submission', 'title description student artifacts')
    .populate('submission.student', 'name email');

  if (!evaluation) {
    return res.json(null);
  }
  res.json(evaluation);
});

// @desc    Create or update evaluation
// @route   POST /api/evaluations
// @access  Private (evaluator)
const createOrUpdateEvaluation = asyncHandler(async (req, res) => {
  const { criteriaId, submissionId, marks, comments, academicYear } = req.body;

  if (!criteriaId) {
    res.status(400);
    throw new Error('Criteria ID is required');
  }

  // Marks and comments are optional - only validate if provided
  if (marks !== undefined && marks !== null && marks !== '') {
    // Verify criteria exists
    const criteria = await Criteria.findById(criteriaId);
    if (!criteria) {
      res.status(404);
      throw new Error('Criteria not found');
    }

    // Validate marks against criteria maxMarks
    const criteriaMaxMarks = criteria.maxMarks || 20;
    const marksValue = parseFloat(marks);
    if (isNaN(marksValue) || marksValue < 0 || marksValue > criteriaMaxMarks) {
      res.status(400);
      throw new Error(`Marks must be between 0 and ${criteriaMaxMarks}`);
    }
  }

  // Verify criteria exists (for comments-only or empty evaluations)
  const criteria = await Criteria.findById(criteriaId);
  if (!criteria) {
    res.status(404);
    throw new Error('Criteria not found');
  }

  // Verify submission exists if provided
  if (submissionId) {
    const submission = await StudentSubmission.findById(submissionId);
    if (!submission) {
      res.status(404);
      throw new Error('Submission not found');
    }
  }

  // Check if evaluation already exists
  // When submissionId is null, use $or to handle null properly
  const query = {
    evaluator: req.user._id,
    criteria: criteriaId,
  };
  
  if (submissionId) {
    query.submission = submissionId;
  } else {
    query.$or = [
      { submission: null },
      { submission: { $exists: false } },
    ];
  }
  
  const existingEvaluation = await Evaluation.findOne(query);

  if (existingEvaluation) {
    // Update existing evaluation
    if (marks !== undefined && marks !== null && marks !== '') {
      existingEvaluation.marks = parseFloat(marks);
    }
    if (comments !== undefined && comments !== null && comments !== '') {
      existingEvaluation.comments = comments.trim();
    }
    if (academicYear) existingEvaluation.academicYear = academicYear;
    existingEvaluation.evaluationDate = new Date();
    await existingEvaluation.save();

    const populated = await Evaluation.findById(existingEvaluation._id)
      .populate('criteria', 'code name description')
      .populate('submission', 'title description student artifacts')
      .populate('submission.student', 'name email');
    
    return res.json(populated);
  }

  // Create new evaluation
  const evaluationData = {
    evaluator: req.user._id,
    criteria: criteriaId,
    submission: submissionId || null,
    marks: (marks !== undefined && marks !== null && marks !== '') ? parseFloat(marks) : 0,
    comments: (comments !== undefined && comments !== null && comments !== '') ? comments.trim() : '',
    academicYear: academicYear || undefined,
  };
  
  const evaluation = await Evaluation.create(evaluationData);

  const populated = await Evaluation.findById(evaluation._id)
    .populate('criteria', 'code name description')
    .populate('submission', 'title description student artifacts')
    .populate('submission.student', 'name email');

  res.status(201).json(populated);
});

// @desc    Get evaluations summary by criteria
// @route   GET /api/evaluations/summary
// @access  Private (evaluator)
const getEvaluationsSummary = asyncHandler(async (req, res) => {
  console.log('[EVALUATION SUMMARY] Fetching summary for evaluator:', req.user._id);
  const evaluations = await Evaluation.find({ evaluator: req.user._id })
    .populate('criteria', 'code name description')
    .populate('submission', 'title student')
    .populate('submission.student', 'name email');
  
  console.log('[EVALUATION SUMMARY] Found evaluations:', evaluations.length);

  // Group by criteria
  const summary = {};
  evaluations.forEach((evaluation) => {
    // Skip if criteria is not populated
    if (!evaluation.criteria || !evaluation.criteria.code) {
      console.warn('[EVALUATION SUMMARY] Skipping evaluation with missing criteria:', evaluation._id);
      return;
    }
    
    const criteriaCode = evaluation.criteria.code;
    if (!summary[criteriaCode]) {
      summary[criteriaCode] = {
        criteria: evaluation.criteria,
        evaluations: [],
        averageMarks: 0,
        totalEvaluations: 0,
      };
    }
    summary[criteriaCode].evaluations.push(evaluation);
    summary[criteriaCode].totalEvaluations++;
  });

  // Calculate averages
  Object.keys(summary).forEach((code) => {
    if (summary[code].totalEvaluations > 0) {
      const totalMarks = summary[code].evaluations.reduce((sum, e) => sum + e.marks, 0);
      summary[code].averageMarks = totalMarks / summary[code].totalEvaluations;
    }
  });

  console.log('[EVALUATION SUMMARY] Returning summary with', Object.keys(summary).length, 'criteria groups');
  res.json(summary);
});

module.exports = {
  getCriteriaForEvaluation,
  getSubmissionsByCriteria,
  getAllSubmissions,
  getMyEvaluations,
  getEvaluation,
  getEvaluationByCriteria,
  createOrUpdateEvaluation,
  getEvaluationsSummary,
};
