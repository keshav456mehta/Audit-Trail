const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('../errors');
const { signToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Used so an unknown username costs the same time as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new AppError(429, 'TOO_MANY_ATTEMPTS', 'Too many login attempts. Try again later.')),
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    throw new AppError(400, 'INVALID_CREDENTIALS_SHAPE', 'username and password are required');
  }

  const user = await User.findOne({ username: username.trim().toLowerCase() });
  const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !matches) {
    throw new AppError(401, 'BAD_CREDENTIALS', 'Incorrect username or password');
  }

  res.json({
    success: true,
    token: signToken(user),
    expiresIn: config.jwtExpiresIn,
    user: { username: user.username, role: user.role },
  });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: { username: req.user.username, role: req.user.role } });
});

module.exports = router;
