const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { getDocuments, getMyDocuments, uploadDocument } = require('../controllers/documentController');
const upload = require('../middleware/uploadMiddleware');
const multer = require('multer'); // Added multer import

const router = express.Router();

router.route('/').get(protect, admin, getDocuments);
router.route('/mine').get(protect, getMyDocuments);
router.route('/upload').post(protect, upload.single('document'), uploadDocument);

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message); // Log Multer-specific error
    res.status(400).json({ message: err.message });
  } else if (err) {
    console.error('Generic upload error:', err.message); // Log any other errors
    res.status(500).json({ message: 'File upload failed.' });
  }
  next();
});

module.exports = router;
