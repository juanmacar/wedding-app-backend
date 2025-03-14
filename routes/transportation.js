import express from 'express';
import TransportationReservation from '../models/TransportationReservation.js';
import TransportationAvailability from '../models/TransportationAvailability.js';
import {
  updateReservationAndAvailability,
  createReservationAndUpdateAvailability
} from '../services/transportationReservationTransactions.js';

const router = express.Router();
const coupleId = '0001';

// Get transportation availability or reservation by invitation ID
router.get('/:invitationId?', async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!invitationId) {
      const availability = await TransportationAvailability.findOne({ coupleId });
      return res.status(200).json(availability);
    }

    const transportationReservation = await TransportationReservation.findOne({ invitationId });
    if (!transportationReservation) {
      return res.status(404).json({ error: `Transportation Reservation not found with invitation ID ${invitationId}` });
    }

    return res.status(200).json(transportationReservation);
  } catch (error) {
    console.error('Error in GET /transportation:', error);
    return res.status(500).json({ error: 'An error occurred while fetching transportation information' });
  }
});

// Create new transportation reservation
router.post('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { body } = req;
    body.invitationId = invitationId;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Check if transportation reservation already exists
    const existingTransportationReservation = await TransportationReservation.findOne({ invitationId });
    if (existingTransportationReservation) {
      return res.status(409).json({ error: 'Transportation Reservation with this invitationId already exists' });
    }

    // Check if this couple offers transportation
    const transportationExists = await TransportationAvailability.findOne({ coupleId });
    if (!transportationExists) {
      return res.status(404).json({ error: 'Transportation not found for this couple' });
    }

    // Create new transportation reservation
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
    console.error('Error in POST /transportation:', error);
    return res.status(500).json({ error: 'An error occurred while creating transportation reservation' });
  }
});

// Update transportation reservation
router.put('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { body } = req;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const transportationReservation = await TransportationReservation.findOne({ invitationId });
    if (!transportationReservation) {
      return res.status(404).json({ error: `Transportation Reservation not found with invitation ID ${invitationId}` });
    }

    // Check if this couple offers transportation
    const transportationExists = await TransportationAvailability.findOne({ coupleId });
    if (!transportationExists) {
      return res.status(404).json({ error: 'Transportation not found for this couple' });
    }

    // Update existing transportation reservation
    const NewRequiredSpots = body.adults + body.children;
    const previousSpotsRequired = transportationReservation.adults + transportationReservation.children;
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
    console.error('Error in PUT /transportation:', error);
    return res.status(500).json({ error: 'An error occurred while updating transportation reservation' });
  }
});

// Delete transportation reservation
router.delete('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const transportationReservation = await TransportationReservation.findOne({ invitationId });
    if (!transportationReservation) {
      return res.status(404).json({ error: `Transportation Reservation not found with invitation ID ${invitationId}` });
    }

    const spotsToRelease = transportationReservation.adults + transportationReservation.children;

    try {
      // Implement the delete function if it doesn't exist
      // This function should be added to transportationReservationTransactions.js
      // For now, we'll use a simple deleteOne operation
      await TransportationReservation.deleteOne({ invitationId });

      // Update availability
      await TransportationAvailability.findOneAndUpdate(
        { coupleId },
        { $inc: { taken_spots: -spotsToRelease } },
        { new: true }
      );

      return res.status(200).json({ message: 'Transportation reservation deleted successfully' });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error in DELETE /transportation:', error);
    return res.status(500).json({ error: 'An error occurred while deleting transportation reservation' });
  }
});

export default router;
