//PURPOSE: This file configures JWT token generation and verification for user authentication 
// in the backend server.

// config/jwt.js - JWT token generation and verification
const jwt = require('jsonwebtoken');



// Secret key for signing JWTs, should be set in environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';



// Function to sign a JWT with a given payload and expiration time
exports.signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });



// Function to verify a JWT and return the decoded payload
exports.verifyToken = (token) =>
  jwt.verify(token, JWT_SECRET);
