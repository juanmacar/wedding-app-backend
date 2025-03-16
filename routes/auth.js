import express from 'express';
import User from '../models/User.js';
import Wedding from '../models/Wedding.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      email, password, weddingId, weddingName
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user - ALWAYS set isAdmin and isVenue to false for security
    // These privileges should only be granted by existing admins
    const user = new User({
      email,
      password,
      isAdmin: false,
      isVenue: false,
      weddings: [] // Initialize empty weddings array
    });

    await user.save();

    let weddingData;

    // If weddingId is provided, try to join that wedding
    if (weddingId) {
      const existingWedding = await Wedding.findById(weddingId);

      if (existingWedding) {
        // Add user to the existing wedding
        existingWedding.users.push(user._id);
        await existingWedding.save();

        // Add wedding to user's weddings array
        user.weddings.push(existingWedding._id);
        await user.save();

        weddingData = existingWedding;
      } else {
        // Wedding ID was provided but not found
        console.log(`Wedding with ID ${weddingId} not found`);
      }
    }

    // If no weddingId was provided or the provided one wasn't found, create a new wedding
    if (!weddingData) {
      // Create a new wedding with this user
      const newWedding = new Wedding({
        weddingName: weddingName || 'Nuestra boda',
        users: [user._id]
      });

      await newWedding.save();

      // Add wedding to user's weddings array
      user.weddings.push(newWedding._id);
      await user.save();

      weddingData = newWedding;
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (excluding password) and token
    const userData = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      isVenue: user.isVenue,
      createdAt: user.createdAt,
      weddings: [weddingData] // Include the wedding data in the response
    };

    return res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Error in POST /api/auth/signup:', error);
    return res.status(500).json({ error: 'An error occurred while registering user' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email and populate weddings
    const user = await User.findOne({ email }).populate('weddings');

    // Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (excluding password) and token
    return res.status(200).json({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      isVenue: user.isVenue,
      weddings: user.weddings,
      token
    });
  } catch (error) {
    console.error('Error in POST /api/auth/login:', error);
    return res.status(500).json({ error: 'An error occurred while logging in' });
  }
});

export default router;
