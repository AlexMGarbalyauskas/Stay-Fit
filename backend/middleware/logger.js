//Logger.js used for logging incoming requests. 
// It logs the HTTP method, URL, 
// and timestamp of each request to the console. 
// This is useful for monitoring and debugging purposes.


// Middleware to log incoming requests
module.exports = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};
