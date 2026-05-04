import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import asyncHandler from '../utils/asyncHandler.js';

export const signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
  }

  const { name, email, password } = req.body;
  let { role } = req.body;

  if (role === 'Admin' && process.env.ALLOW_ADMIN_SIGNUP !== 'true') {
    return res.status(403).json({
      message:
        'Creating an Admin account is disabled. Set ALLOW_ADMIN_SIGNUP=true temporarily to bootstrap an admin, then disable it.',
    });
  }
  if (role !== 'Admin') {
    role = 'Member';
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    role,
  });

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const me = asyncHandler(async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});
