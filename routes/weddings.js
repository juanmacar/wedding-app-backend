// routes/weddings.js
import express from 'express';
import Wedding from '../models/Wedding.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/weddings
 * @desc    Get all weddings associated with the authenticated user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    // Find all weddings that have this user in their users array
    const weddings = await Wedding.find({ users: req.user._id });

    return res.status(200).json(weddings);
  } catch (error) {
    console.error('Error in GET /api/weddings:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching weddings'
    });
  }
});

/**
 * @route   GET /api/weddings/:id
 * @desc    Get a specific wedding by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id);

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Check if the user is associated with this wedding
    if (!wedding.users.includes(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'You are not authorized to view this wedding'
      });
    }

    return res.status(200).json(wedding);
  } catch (error) {
    console.error('Error in GET /api/weddings/:id:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching the wedding'
    });
  }
});

/**
 * @route   PUT /api/weddings/:id
 * @desc    Update a wedding's details
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const {
      weddingName, weddingDate, venue, theme, settings
    } = req.body;

    // Find the wedding
    const wedding = await Wedding.findById(req.params.id);

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Check if the user is associated with this wedding
    if (!wedding.users.includes(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'You are not authorized to update this wedding'
      });
    }

    // Update the wedding fields if they are provided
    if (weddingName) wedding.weddingName = weddingName;
    if (weddingDate) wedding.weddingDate = weddingDate;
    if (venue) wedding.venue = venue;
    if (theme) wedding.theme = theme;
    if (settings) wedding.settings = { ...wedding.settings, ...settings };

    await wedding.save();

    return res.status(200).json(wedding);
  } catch (error) {
    console.error('Error in PUT /api/weddings/:id:', error);
    return res.status(500).json({
      error: 'An error occurred while updating the wedding'
    });
  }
});

export default router;
