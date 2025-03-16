import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../services/errors.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_change_this_in_production');

      // Find user by id
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new AppError('Not authorized, user not found', 401));
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Not authorized, token failed', 401));
    }
  } catch (error) {
    next(error);
  }
};
