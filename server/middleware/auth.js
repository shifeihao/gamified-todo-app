import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from "dotenv";
dotenv.config(); 
// The JWT key should be stored in an environment variable in a real project.
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify if the user is logged in
const protect = async (req, res, next) => {
  let token;

    // Check if the request header contains a token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get a token
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user information (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Unauthorized, token invalid' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Unauthorized, no token' });
  }
};

// Middleware that checks if the user is an administrator
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'No permissions, administrator access only' });
  }
};

// Tool function for generating JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d', // Token is valid for 30 days
  });
};

export { protect, admin, generateToken };
