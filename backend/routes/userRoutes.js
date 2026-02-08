const express = require('express');
const { registerAdmin, authUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { registerFaculty } = require('../controllers/userController');
const { getFaculty } = require('../controllers/userController');
const { registerStudent, registerEvaluator } = require('../controllers/userController');

const router = express.Router();

router.post('/admin/register', registerAdmin);
router.post('/login', authUser);
router.route('/faculty').post(protect, admin, registerFaculty);
router.route('/faculty').get(protect, admin, getFaculty);
router.post('/student/register', registerStudent);
router.post('/evaluator/register', registerEvaluator);

// Health check endpoint
router.get('/test', (req, res) => {
  res.status(200).send('Backend is healthy');
});

module.exports = router;
