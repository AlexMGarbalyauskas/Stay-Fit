const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://stay-fit-2.onrender.com',
];

module.exports = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS not allowed'), false);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
