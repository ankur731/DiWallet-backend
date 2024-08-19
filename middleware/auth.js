const jwt = require('jsonwebtoken'); // If you are using JWT for token handling

// Middleware function to check if token is present
const authMiddleware = (req, res, next) => {
  // Get token from the request headers
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  // Check if the token is not present
  if (!token) {
    return res.status(401).json({ msg: "No token provided. Authorization denied." });
  }

  try {
    // If you are using JWT, you can verify the token here
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded token to the request object for use in other routes
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Unauthorized Access" });
  }
};

module.exports = authMiddleware;
