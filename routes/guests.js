import express from 'express';
import mongoose from 'mongoose';
import Guest from '../models/Guest.js';
import Wedding from '../models/Wedding.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/guests/:weddingId
 * @desc    Get all guests for the specified wedding ID
 * @access  Private
 */
router.get('/:weddingId', protect, async (req, res) => {
  try {
    // Get the weddingId from path params
    const { weddingId } = req.params;

    if (!weddingId) {
      return res.status(400).json({ error: 'Wedding ID is required' });
    }

    // Find the wedding
    const wedding = await Wedding.findById(weddingId);

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Check if the user is associated with this wedding
    if (!wedding.users.includes(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'You are not authorized to view guests for this wedding'
      });
    }

    // Find all guests for this wedding
    const guests = await Guest.find({ wedding: new mongoose.Types.ObjectId(weddingId) });

    return res.status(200).json(guests);
  } catch (error) {
    console.error('Error in GET /api/guests/:weddingId:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching guests'
    });
  }
});

/**
 * @route   POST /api/guests
 * @desc    Create a new guest for a specific wedding
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      weddingId, invitationId, type, mainGuest, hasCompanion, companion, hasChildren, children
    } = req.body;

    // Validate required fields
    if (!weddingId || !invitationId || !type || !mainGuest) {
      return res.status(400).json({
        error: 'Wedding ID, invitation ID, type, and main guest details are required'
      });
    }

    // Find the wedding
    const wedding = await Wedding.findById(weddingId);

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Check if the user is associated with this wedding
    if (!wedding.users.includes(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'You are not authorized to add guests for this wedding'
      });
    }

    // Create the guest
    const guest = new Guest({
      invitationId,
      wedding: new mongoose.Types.ObjectId(weddingId),
      type,
      mainGuest,
      hasCompanion: hasCompanion || false,
      companion,
      hasChildren: hasChildren || false,
      children: children || []
    });

    await guest.save();

    return res.status(201).json(guest);
  } catch (error) {
    console.error('Error in POST /api/guests:', error);
    return res.status(500).json({
      error: 'An error occurred while creating the guest'
    });
  }
});

export default router;
