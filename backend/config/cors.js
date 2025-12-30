const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.0.16:3000',
  'https://stay-fit-1.onrender.com',
  'https://stay-fit-2.onrender.com',
];

module.exports = () =>
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('CORS not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
