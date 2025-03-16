import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user - ALWAYS set isAdmin and isVenue to false for security
    // These privileges should only be granted by existing admins
    const user = new User({
      username,
      password,
      isAdmin: false,
      isVenue: false
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (excluding password) and token
    const userData = {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isVenue: user.isVenue,
      createdAt: user.createdAt
    };

    return res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Error in POST /auth/signup:', error);
    return res.status(500).json({ error: 'An error occurred while registering user' });
  }
});

export default router;
