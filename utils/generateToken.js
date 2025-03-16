import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object from database
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  // Create payload with user data (excluding sensitive information)
  const payload = {
    id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
    isVenue: user.isVenue
  };

  // Get JWT secret from environment variables
  const secret = process.env.JWT_SECRET || 'default_jwt_secret_change_this_in_production';
  
  // Set token expiration (default: 30 days)
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

  // Generate and return token
  return jwt.sign(payload, secret, { expiresIn });
};

export default generateToken;
