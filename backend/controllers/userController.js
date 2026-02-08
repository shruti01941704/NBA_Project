const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const School = require('../models/School');

// @desc    Register a new admin
// @route   POST /api/users/admin/register
// @access  Public
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'admin',
  });

  if (user) {
    const school = await School.create({
      name: `${name}'s School`,
      admin: user._id,
    });

    user.school = school._id;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      token: generateToken(user._id, user.school, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Register a new student
// @route   POST /api/users/student/register
// @access  Public
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, schoolId } = req.body;

  // Admin making the request must be an admin and belong to the school
  if (req.user.role !== 'admin' || req.user.school.toString() !== schoolId) {
    res.status(401);
    throw new Error('Not authorized to register students for this school');
  }

  const userExists = await User.findOne({ email, school: req.user.school });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    school: schoolId,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      token: generateToken(user._id, user.school, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Register a new evaluator
// @route   POST /api/users/evaluator/register
// @access  Public
const registerEvaluator = asyncHandler(async (req, res) => {
  const { name, email, password, schoolId } = req.body;

  // Admin making the request must be an admin and belong to the school
  if (req.user.role !== 'admin' || req.user.school.toString() !== schoolId) {
    res.status(401);
    throw new Error('Not authorized to register evaluators for this school');
  }

  const userExists = await User.findOne({ email, school: req.user.school });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'evaluator',
    school: schoolId,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      token: generateToken(user._id, user.school, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Register a new faculty
// @route   POST /api/users/faculty
// @access  Private/Admin
const registerFaculty = asyncHandler(async (req, res) => {
  const { name, email, password, schoolId } = req.body;

  // Admin making the request must be an admin and belong to the school
  if (req.user.role !== 'admin' || req.user.school.toString() !== schoolId) {
    res.status(401);
    throw new Error('Not authorized to register faculty for this school');
  }

  const userExists = await User.findOne({ email, school: req.user.school });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'faculty',
    school: schoolId,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('[AUTH_LOGIN] body keys:', Object.keys(req.body || {}));
  console.log('[AUTH_LOGIN] email:', email);

  const user = await User.findOne({ email }).populate('assignedCriteria');

  console.log('[AUTH_LOGIN] userFound:', !!user, 'role:', user?.role);
  console.log('[AUTH_LOGIN] user.assignedCriteria:', user?.assignedCriteria); // Add this log

  if (user && (await user.matchPassword(password))) {
    console.log('[AUTH_LOGIN] password match success for user:', user._id.toString());
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      assignedCriteria: user.assignedCriteria, // Explicitly include assignedCriteria
      token: generateToken(user._id, user.school, user.role),
    });
  } else {
    console.log('[AUTH_LOGIN] invalid credentials for email:', email);
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get all faculty users
// @route   GET /api/users/faculty
// @access  Private/Admin
const getFaculty = asyncHandler(async (req, res) => {
  const faculty = await User.find({ role: 'faculty', $or: [{ school: req.user.school }, { school: null }] }).select('-password');
  res.json(faculty);
});

module.exports = { registerAdmin, authUser, registerFaculty, getFaculty, registerStudent, registerEvaluator };
