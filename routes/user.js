import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile information based on token
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is already set by the protect middleware with password excluded
    // We only need to populate the weddings to get their details
    await req.user.populate('weddings');

    // Return the user object that's already in req.user
    return res.status(200).json(req.user);
  } catch (error) {
    console.error('Error in GET /api/user/me:', error);
    return res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
});

export default router;
