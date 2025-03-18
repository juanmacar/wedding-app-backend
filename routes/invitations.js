import express from 'express';
import mongoose from 'mongoose';
import Invitation from '../models/Invitation.js';
import Wedding from '../models/Wedding.js';
import { protect } from '../middleware/authMiddleware.js';
import { updateRSVPAndRelatedReservations } from '../services/rsvpTransactions.js';

const router = express.Router();

/**
 * @route   GET /api/guests/wedding/:weddingId
 * @desc    Get all guests for the specified wedding ID
 * @access  Private
 */
router.get('/wedding/:weddingId', protect, async (req, res) => {
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
    const invitations = await Invitation.find({ weddingId: new mongoose.Types.ObjectId(weddingId) });

    return res.status(200).json(invitations);
  } catch (error) {
    console.error('Error in GET /api/invitations/wedding/:weddingId:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching invitations'
    });
  }
});

/**
 * @route   GET /api/guests/invitation/:invitationId
 * @desc    Get guest by invitation ID (public endpoint for RSVP)
 * @access  Public
 */
router.get('/:invitationId', async (req, res) => {
  try {
    console.log('GET /api/invitations/:invitationId request received');
    console.log('URL parameters:', req.params);

    const { invitationId } = req.params;
    console.log('Extracted invitationId:', invitationId);

    if (!invitationId) {
      console.log('No invitationId provided, returning 400');
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Use _id directly as the invitationId
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Guest not found with invitation ID ${invitationId}` });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(invitation);
  } catch (error) {
    console.error('Error in GET /api/invitations/:invitationId:', error);
    return res.status(500).json({ error: 'An error occurred while fetching guest' });
  }
});

/**
 * @route   POST /api/guests/invitation
 * @desc    Create a new invitation (guest entry) for a wedding
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      weddingId, type, mainGuest, hasCompanion, companion, hasChildren, children
    } = req.body;

    // Validate required fields
    if (!weddingId || !type || !mainGuest) {
      return res.status(400).json({
        error: 'Wedding ID, type, and main guest details are required'
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

    // Create the guest - MongoDB will automatically generate _id which we'll use as invitationId
    const newInvitation = new Invitation({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      type,
      mainGuest,
      hasCompanion: hasCompanion || false,
      companion,
      hasChildren: hasChildren || false,
      children: children || []
    });

    const savedInvitation = await newInvitation.save();

    return res.status(201).json(savedInvitation);
  } catch (error) {
    console.error('Error in POST /api/invitations', error);
    return res.status(500).json({
      error: 'An error occurred while creating the invitation'
    });
  }
});

/**
 * @route   PUT /api/guests/invitation/:invitationId
 * @desc    Update guest RSVP information (public endpoint)
 * @access  Public
 */
router.put('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const updateFields = req.body;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Prepare update operation
    const updateOperation = { $set: {} };

    // First, get the current document to check for null fields
    // Use _id directly as the invitationId
    const currentInvitation = await Invitation.findById(invitationId);
    if (!currentInvitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Helper function to process nested objects and arrays
    const processObject = (obj, parentKey = '', currentObj = null) => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (value === null) {
          // Handle null values directly
          updateOperation.$set[fullKey] = null;
        } else if (typeof value === 'object') {
          // Get current value for this path
          const current = currentObj
            ? parentKey ? currentObj[parentKey]?.[key] : currentObj[key]
            : null;

          // If current value is null, set the entire object/array at once
          if (current === null) {
            updateOperation.$set[fullKey] = value;
          } else {
            // For arrays, process each element
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                  processObject(item, `${fullKey}.${index}`, currentObj);
                } else {
                  updateOperation.$set[`${fullKey}.${index}`] = item;
                }
              });
            } else {
              // For objects, recursively process nested fields
              processObject(value, fullKey, currentObj);
            }
          }
        } else {
          // Handle primitive values directly
          updateOperation.$set[fullKey] = value;
        }
      });
    };

    // Process all update fields
    processObject(updateFields, '', currentInvitation);

    console.log('Request body:', JSON.stringify(updateFields, null, 2));
    console.log('Current document:', JSON.stringify(currentInvitation, null, 2));
    console.log('Update operation:', JSON.stringify(updateOperation, null, 2));

    // Find and update the guest
    try {
      // Use _id directly as the invitationId for the update function
      const updatedInvitation = await updateRSVPAndRelatedReservations(invitationId, updateFields, updateOperation);
      if (!updatedInvitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      return res.status(200).json({
        message: 'Invitation updated successfully',
        invitation: updatedInvitation
      });
    } catch (error) {
      console.error('Error updating invitation:', error);
      return res.status(error.statusCode || 500).json({ error: error.message || 'An error occurred while updating invitation' });
    }
  } catch (error) {
    console.error('Error in PUT /api/invitations/:invitationId:', error);
    return res.status(500).json({ error: 'An error occurred while updating invitation' });
  }
});

export default router;
