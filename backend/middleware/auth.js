//auth.js used for authenticating requests using JWT. 
// It checks for the presence of an Authorization header, 
// verifies the token, and attaches the decoded user 
// information to the request object for use in 
// subsequent middleware or route handlers.


// Middleware to authenticate requests using JWT
const jwt = require('jsonwebtoken');



// In a production environment, use a secure secret and store it in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';



// Middleware function to authenticate requests
module.exports = function auth(req, res, next) {

  // Check for the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });


  
  // Expecting header format: "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid auth header' });



  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};
