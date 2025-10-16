const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  console.log('AdminAuth middleware hit');
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Token received:', token ? 'Token present' : 'No token');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { adminAuth, authenticateUser };
