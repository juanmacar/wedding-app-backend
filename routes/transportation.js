import express from 'express';
import Invitation from '../models/Invitation.js';
import TransportationReservation from '../models/TransportationReservation.js';
import Wedding from '../models/Wedding.js';
import {
  updateReservationAndAvailability,
  createReservationAndUpdateAvailability,
  deleteReservationAndUpdateAvailability
} from '../services/transportationReservationTransactions.js';
import { TransportationError } from '../services/errors.js';

const router = express.Router();

// Get transportation availability using invitationId
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

    // Check if weddingId exists before trying to use it
    if (!invitation.weddingId) {
      throw new TransportationError('Wedding ID not found in invitation', 400);
    }

    const weddingId = invitation.weddingId.toString();

    // Get the wedding to check transportation availability
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    if (!wedding.transportation) {
      return res.status(404).json({ error: 'Transportation not available for this wedding' });
    }

    // Return just the availability information
    return res.status(200).json(
      wedding.transportation
    );
  } catch (error) {
    console.error('Error getting transportation availability:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get transportation availability or reservation by invitation ID
router.get('/:invitationId?', async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!invitationId) {
      // This branch seems incomplete - we need weddingId to get availability
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Invitation not found with ID ${invitationId}` });
    }

    // Check if weddingId exists before trying to use it
    if (!invitation.weddingId) {
      throw new TransportationError('Wedding ID not found in invitation', 400);
    }

    const weddingId = invitation.weddingId.toString();

    // First check if there's a reservation for this invitation
    const transportationReservation = await TransportationReservation.findOne({ invitationId });
    if (!transportationReservation) {
      return res.status(404).json({ error: `Transportation Reservation not found with invitation ID ${invitationId}` });
    }
    // Get the wedding to check transportation availability
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Return both reservation (if exists) and availability information
    return res.status(200).json({
      reservation: transportationReservation
    });
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
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Invitation not found with ID ${invitationId}` });
    }
    // Check if weddingId exists before trying to use it
    if (!invitation.weddingId) {
      throw new TransportationError('Wedding ID not found in invitation', 400);
    }

    const weddingId = invitation.weddingId.toString();

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Check if transportation reservation already exists
    const existingTransportationReservation = await TransportationReservation.findOne({ invitationId });
    if (existingTransportationReservation) {
      return res.status(409).json({ error: 'Transportation Reservation with this invitationId already exists' });
    }

    // Check if this wedding has transportation configured
    const wedding = await Wedding.findById(weddingId);
    if (!wedding || wedding.transportation.totalSpots <= 0) {
      console.log('weddingId', weddingId, 'wedding transportation not configured');
      return res.status(404).json({ error: 'Transportation not configured for this wedding' });
    }

    // Create new transportation reservation
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
    console.error('Error in POST /transportation:', error);
    return res.status(500).json({ error: 'An error occurred while creating transportation reservation' });
  }
});

// Update transportation reservation
router.put('/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { body } = req;
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Invitation not found with ID ${invitationId}` });
    }
    // Check if weddingId exists before trying to use it
    if (!invitation.weddingId) {
      throw new TransportationError('Wedding ID not found in invitation', 400);
    }

    const weddingId = invitation.weddingId.toString();

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const transportationReservation = await TransportationReservation.findOne({ invitationId });
    if (!transportationReservation) {
      return res.status(404).json({ error: `Transportation Reservation not found with invitation ID ${invitationId}` });
    }

    // Make sure the wedding exists for the transaction
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Update existing transportation reservation
    const NewRequiredSpots = body.adults + body.children;
    const previousSpotsRequired = transportationReservation.adults + transportationReservation.children;
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

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: `Invitation not found with ID ${invitationId}` });
    }

    // Check if weddingId exists before trying to use it
    if (!invitation.weddingId) {
      throw new TransportationError('Wedding ID not found in invitation', 400);
    }

    const weddingId = invitation.weddingId.toString();

    const transportationReservation = await TransportationReservation.findOne({ invitationId });
    if (!transportationReservation) {
      return res.status(404).json({ error: `Transportation Reservation not found with invitation ID ${invitationId}` });
    }

    try {
      await deleteReservationAndUpdateAvailability(invitationId, weddingId);
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
