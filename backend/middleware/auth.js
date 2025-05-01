const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  console.log('Headers:', req.headers);
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('No authorization header');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token in authorization header');
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    console.log('Verifying token...');
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token verified:', verified);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token: ' + error.message });
  }
};

module.exports = verifyToken; 