//PURPOSE: This file configures CORS (Cross-Origin Resource Sharing) for the backend server.


// CORS configuration to allow requests from specific origins
const cors = require('cors');



// List of domains that are allowed to access my backend
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.0.16:3000',
  'https://stay-fit-1.onrender.com',
  'https://stay-fit-2.onrender.com',
];



// CORS configuration to allow requests from the specified origins
module.exports = () =>
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('CORS not allowed'));
    },

    credentials: true,

    //Allow cookies, tokens, and credentials 
    // to be sent across domains
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
