import express from 'express';
import LodgingReservation from '../models/LodgingReservation.js';
import LodgingAvailability from '../models/LodgingAvailability.js';
import {
  updateReservationAndAvailability,
  createReservationAndUpdateAvailability,
  deleteReservationAndUpdateAvailability
} from '../services/lodgingReservationTransactions.js';

const router = express.Router();
const coupleId = '0001';

// Get lodging availability or reservation by invitation ID
router.get('/:invitationId?', async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!invitationId) {
      const availability = await LodgingAvailability.findOne({ coupleId });
      return res.status(200).json(availability);
    }

    const lodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (!lodgingReservation) {
      return res.status(404).json({ error: `Lodging Reservation not found with invitation ID ${invitationId}` });
    }

    return res.status(200).json(lodgingReservation);
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

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Check if lodging reservation already exists
    const existingLodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (existingLodgingReservation) {
      return res.status(409).json({ error: 'Lodging Reservation with this invitationId already exists' });
    }

    // Check if this couple offers lodging
    const lodgingExists = await LodgingAvailability.findOne({ coupleId });
    if (!lodgingExists) {
      return res.status(404).json({ error: 'Lodging not found for this couple' });
    }

    // Create new lodging reservation
    const requiredSpots = body.adults + body.children;

    try {
      const result = await createReservationAndUpdateAvailability(body, coupleId, requiredSpots);
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

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const lodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (!lodgingReservation) {
      return res.status(404).json({ error: `Lodging Reservation not found with invitation ID ${invitationId}` });
    }

    // Check if this couple offers lodging
    const lodgingExists = await LodgingAvailability.findOne({ coupleId });
    if (!lodgingExists) {
      return res.status(404).json({ error: 'Lodging not found for this couple' });
    }

    // Update existing lodging reservation
    const NewRequiredSpots = body.adults + body.children;
    const previousSpotsRequired = lodgingReservation.adults + lodgingReservation.children;
    const spotsDiff = NewRequiredSpots - previousSpotsRequired;

    try {
      const result = await updateReservationAndAvailability(invitationId, body, coupleId, spotsDiff);
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

    const lodgingReservation = await LodgingReservation.findOne({ invitationId });
    if (!lodgingReservation) {
      return res.status(404).json({ error: `Lodging Reservation not found with invitation ID ${invitationId}` });
    }

    const spotsToRelease = lodgingReservation.adults + lodgingReservation.children;

    try {
      await deleteReservationAndUpdateAvailability(invitationId, coupleId, spotsToRelease);
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
