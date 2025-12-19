const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

exports.signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

exports.verifyToken = (token) =>
  jwt.verify(token, JWT_SECRET);
