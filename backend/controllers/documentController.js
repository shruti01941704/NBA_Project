const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private/Faculty
const uploadDocument = asyncHandler(async (req, res) => {
  const { title, description, criteria, year } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  console.log('[uploadDocument] req.user.school:', req.user.school);

  const document = await Document.create({
    title,
    description,
    file: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
    school: req.user.school,
    criteria,
    year,
  });

  if (document) {
    res.status(201).json({
      _id: document._id,
      title: document.title,
      description: document.description,
      file: document.file,
      uploadedBy: document.uploadedBy,
      criteria: document.criteria,
      year: document.year,
    });
  } else {
    res.status(400);
    throw new Error('Invalid document data');
  }
});

// @desc    Get documents with filters
// @route   GET /api/documents
// @access  Private/Admin
const getDocuments = asyncHandler(async (req, res) => {
  const { criteria, year } = req.query;

  let filter = {};

  if (criteria) {
    filter.criteria = criteria;
  }

  if (year) {
    filter.year = year;
  }

  // Filter by the admin's school, or include documents with no school assigned
  filter.$or = [{ school: req.user.school }, { school: null }];

  const documents = await Document.find(filter)
    .populate('uploadedBy', 'name email')
    .populate('criteria', 'name');

  res.json(documents);
});

// @desc    Get documents uploaded by the logged-in user (faculty)
// @route   GET /api/documents/mine
// @access  Private
const getMyDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ uploadedBy: req.user._id, school: req.user.school })
    .populate('criteria', 'name');

  res.json(documents);
});

module.exports = { getDocuments, uploadDocument, getMyDocuments };
