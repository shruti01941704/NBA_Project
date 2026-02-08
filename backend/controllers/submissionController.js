const asyncHandler = require('express-async-handler');
const path = require('path');
const StudentSubmission = require('../models/StudentSubmission');
const Criteria = require('../models/Criteria');

// Helper to build artifact objects from uploaded files
function buildArtifactsFromFiles(files) {
  if (!files || files.length === 0) return [];
  return files.map((f) => {
    const ext = path.extname(f.originalname || '').toLowerCase();
    let type = 'document';
    if (['.jpg', '.jpeg', '.png'].includes(ext)) type = 'image';
    else if (['.mp4', '.mov'].includes(ext)) type = 'video';
    else if (['.ppt', '.pptx'].includes(ext)) type = 'slide';
    else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(ext)) type = 'document';
    
    // Ensure URL always starts with /uploads/
    let fileUrl;
    if (f.path) {
      // f.path might be relative (uploads/filename) or just filename
      const filename = path.basename(f.path);
      fileUrl = `/uploads/${filename}`;
    } else if (f.filename) {
      // Fallback to filename if path not available
      fileUrl = `/uploads/${f.filename}`;
    } else {
      // Last resort
      fileUrl = `/uploads/${f.originalname}`;
    }
    
    return { type, name: f.originalname, url: fileUrl };
  });
}

// Helper to normalize artifact URLs (fix old submissions with incorrect URLs)
function normalizeArtifactUrl(url) {
  if (!url) return url;
  
  // If it's already a complete URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL already starts with /uploads/, return as-is
  if (url.startsWith('/uploads/')) {
    return url;
  }
  
  // Fix URLs that start with /files- or files- (missing /uploads/ prefix)
  if (url.startsWith('/files-')) {
    // Remove leading / and add /uploads/ prefix
    return `/uploads${url}`;
  }
  if (url.startsWith('files-')) {
    return `/uploads/${url}`;
  }
  
  // For any other URL without /uploads/, add it
  // Remove leading / if present, then add /uploads/
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return `/uploads/${cleanUrl}`;
}

// @desc Create a new student submission
// @route POST /api/submissions
// @access Private (student)
const createSubmission = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  let {
    criteriaCode,
    title,
    description,
    courseCode,
    semester,
    tags,
    dateFrom,
    dateTo,
    metadata,
    score,
    artifacts: artifactsFromBody,
  } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('title is required');
  }

  let criteria = null;
  if (criteriaCode) {
    criteria = await Criteria.findOne({ code: criteriaCode });
    if (!criteria) {
      res.status(404);
      throw new Error('Criteria not found');
    }
  }

  const uploadArtifacts = buildArtifactsFromFiles(req.files);
  let bodyArtifacts = [];
  try {
    if (artifactsFromBody) {
      const parsed = typeof artifactsFromBody === 'string' ? JSON.parse(artifactsFromBody) : artifactsFromBody;
      if (Array.isArray(parsed)) {
        bodyArtifacts = parsed
          .filter(a => a && a.type && a.url && a.name)
          .map(a => ({ ...a, url: normalizeArtifactUrl(a.url) }));
      }
    }
  } catch (_) {}

  // Normalize metadata to object and capture simple scalar fields like score
  let metaObj = {};
  try {
    if (metadata) metaObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
  } catch (_) {}
  if (score !== undefined && score !== null && score !== '') {
    metaObj.score = isNaN(Number(score)) ? score : Number(score);
  }

  const submission = await StudentSubmission.create({
    student: studentId,
    school: req.user.school,
    criteria: criteria ? criteria._id : undefined,
    criteriaCode: criteriaCode || undefined,
    title,
    description,
    courseCode,
    semester,
    tags,
    dateFrom,
    dateTo,
    metadata: metaObj,
    artifacts: [...uploadArtifacts, ...bodyArtifacts],
  });

  res.status(201).json(submission);
});

// @desc Get my submissions (student)
// @route GET /api/submissions/mine
// @access Private (student)
const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await StudentSubmission.find({ student: req.user._id, school: req.user.school })
    .populate('criteria', 'code name')
    .sort({ createdAt: -1 });
  
  // Normalize artifact URLs in response (fix any old submissions with incorrect URLs)
  const normalizedSubmissions = submissions.map(sub => ({
    ...sub.toObject(),
    artifacts: sub.artifacts.map(a => ({
      ...a,
      url: normalizeArtifactUrl(a.url)
    }))
  }));
  
  res.json(normalizedSubmissions);
});

// @desc List submissions by criteria (admin/evaluator)
// @route GET /api/submissions
// @access Private (admin/evaluator)
const listSubmissions = asyncHandler(async (req, res) => {
  const { criteriaCode, status } = req.query;
  const filter = {};
  if (criteriaCode) filter.criteriaCode = criteriaCode;
  if (status) filter.verificationStatus = status;

  // Filter by the admin's or evaluator's school
  filter.school = req.user.school;

  const submissions = await StudentSubmission.find(filter)
    .populate('student', 'name email')
    .populate('criteria', 'code name')
    .sort({ createdAt: -1 });
  
  // Normalize artifact URLs in response
  const normalizedSubmissions = submissions.map(sub => ({
    ...sub.toObject(),
    artifacts: sub.artifacts.map(a => ({
      ...a,
      url: normalizeArtifactUrl(a.url)
    }))
  }));
  
  res.json(normalizedSubmissions);
});

// @desc List submissions for criteria assigned to the logged-in faculty
// @route GET /api/submissions/assigned
// @access Private (faculty)
const listAssignedSubmissions = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'faculty') {
    res.status(403);
    throw new Error('Forbidden');
  }
  const assigned = Array.isArray(req.user.assignedCriteria) ? req.user.assignedCriteria : [];
  if (assigned.length === 0) return res.json([]);

  const submissions = await StudentSubmission.find({ criteria: { $in: assigned }, school: req.user.school })
    .populate('student', 'name email')
    .populate('criteria', 'code name')
    .sort({ createdAt: -1 });
  
  // Normalize artifact URLs in response
  const normalizedSubmissions = submissions.map(sub => ({
    ...sub.toObject(),
    artifacts: sub.artifacts.map(a => ({
      ...a,
      url: normalizeArtifactUrl(a.url)
    }))
  }));
  
  res.json(normalizedSubmissions);
});

// @desc Update submission status (approve/reject)
// @route PUT /api/submissions/:id/status
// @access Private (admin/evaluator)
const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reviewerComment } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  const sub = await StudentSubmission.findById(id);
  if (!sub) {
    res.status(404);
    throw new Error('Submission not found');
  }
  sub.verificationStatus = status;
  sub.reviewerComment = reviewerComment || '';
  sub.reviewedBy = req.user._id;
  sub.reviewedAt = new Date();
  await sub.save();
  res.json(sub);
});

module.exports = { createSubmission, getMySubmissions, listSubmissions, listAssignedSubmissions, updateSubmissionStatus };
