const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  console.log('Verifying token in auth middleware');
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('Authorization header:', authHeader);
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Invalid token format in header');
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token verified successfully, decoded JWT:', decoded);
    req.user = decoded;
    console.log('req.user set to:', req.user);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token: ' + error.message });
  }
};

module.exports = verifyToken; 