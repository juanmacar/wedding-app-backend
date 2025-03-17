import express from 'express';
import Invitation from '../models/Invitation.js';
import LodgingReservation from '../models/LodgingReservation.js';
import Wedding from '../models/Wedding.js';
import {
  updateReservationAndAvailability,
  createReservationAndUpdateAvailability,
  deleteReservationAndUpdateAvailability
} from '../services/lodgingReservationTransactions.js';

const router = express.Router();

// Get lodging availability using invitationId
router.get('/availability/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Find the invitation to get the weddingId
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Invitation not found with ID ${invitationId}` });
    }

    const weddingId = invitation.weddingId;

    // Get the wedding to check lodging availability
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    if (!wedding.lodging) {
      return res.status(404).json({ error: 'Lodging not available for this wedding' });
    }

    // Return just the availability information
    return res.status(200).json(
      wedding.lodging
    );
  } catch (error) {
    console.error('Error getting lodging availability:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get lodging availability or reservation by invitation ID
router.get('/:invitationId?', async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Invitation not found with ID ${invitationId}` });
    }

    const weddingId = invitation.weddingId;

    // First check if there's a reservation for this invitation
    const lodgingReservation = await LodgingReservation.findOne({ invitationId });

    // Get the wedding to check lodging availability
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Return both reservation (if exists) and availability information
    return res.status(200).json({
      reservation: lodgingReservation || null,
      availability: {
        total_spots: wedding.lodging.totalSpots,
        taken_spots: wedding.lodging.takenSpots
      }
    });
  } catch (error) {
    console.error('Error in GET /lodging:', error);
    return res.status(500).json({ error: 'An error occurred while fetching lodging information' });
  }
});

// Create new lodging reservation
router.post('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { body } = req;
    body.invitationId = invitationId;
    const invitation = await Invitation.findById(invitationId);
    const weddingId = invitation.weddingId;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Check if lodging reservation already exists
    const existingLodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (existingLodgingReservation) {
      return res.status(409).json({ error: 'Lodging Reservation with this invitationId already exists' });
    }

    // Check if this wedding has lodging configured
    const wedding = await Wedding.findById(weddingId);
    if (!wedding || wedding.lodging.totalSpots <= 0) {
      return res.status(404).json({ error: 'Lodging not configured for this wedding' });
    }

    // Create new lodging reservation
    const requiredSpots = body.adults + body.children;

    try {
      const result = await createReservationAndUpdateAvailability(body, weddingId, requiredSpots);
      return res.status(201).json(result.newReservation);
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error in POST /lodging:', error);
    return res.status(500).json({ error: 'An error occurred while creating lodging reservation' });
  }
});

// Update lodging reservation
router.put('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { body } = req;
    const invitation = await Invitation.findById(invitationId);
    const weddingId = invitation.weddingId;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const lodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (!lodgingReservation) {
      return res.status(404).json({ error: `Lodging Reservation not found with invitation ID ${invitationId}` });
    }

    // Make sure the wedding exists for the transaction
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Update existing lodging reservation
    const NewRequiredSpots = body.adults + body.children;
    const previousSpotsRequired = lodgingReservation.adults + lodgingReservation.children;
    const spotsDiff = NewRequiredSpots - previousSpotsRequired;

    try {
      const result = await updateReservationAndAvailability(invitationId, body, weddingId, spotsDiff);
      return res.status(200).json(result.updatedReservation);
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error in PUT /lodging:', error);
    return res.status(500).json({ error: 'An error occurred while updating lodging reservation' });
  }
});

// Delete lodging reservation
router.delete('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const invitation = await Invitation.findById(invitationId);
    const weddingId = invitation.weddingId;

    const lodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (!lodgingReservation) {
      return res.status(404).json({ error: `Lodging Reservation not found with invitation ID ${invitationId}` });
    }

    const spotsToRelease = lodgingReservation.adults + lodgingReservation.children;

    try {
      await deleteReservationAndUpdateAvailability(invitationId, weddingId, spotsToRelease);
      return res.status(200).json({ message: 'Lodging reservation deleted successfully' });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error in DELETE /lodging:', error);
    return res.status(500).json({ error: 'An error occurred while deleting lodging reservation' });
  }
});

export default router;
