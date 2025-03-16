import express from 'express';
import Guest from '../models/Guest.js';
import { updateRSVPAndRelatedReservations } from '../services/rsvpTransactions.js';

const router = express.Router();
const coupleId = '0001';

// Get guest by invitation ID
router.get('/:invitationId?', async (req, res) => {
  try {
    console.log('GET /rsvp request received');
    console.log('URL parameters:', req.params);
    console.log('Headers:', req.headers);

    const { invitationId } = req.params;
    console.log('Extracted invitationId:', invitationId);

    if (!invitationId) {
      console.log('No invitationId provided, returning 400');
      return res.status(400).json({ error: 'invitationId is required' });
    }

    const guest = await Guest.findOne({ invitationId });
    if (!guest) {
      return res.status(404).json({ error: `Guest not found with invitation ID ${invitationId}` });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(guest);
  } catch (error) {
    console.error('Error in GET /rsvp:', error);
    return res.status(500).json({ error: 'An error occurred while fetching guest' });
  }
});

// Create new guest
router.post('/', async (req, res) => {
  try {
    const { body } = req;
    const { invitationId } = body;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Check if guest already exists
    const existingGuest = await Guest.findOne({ invitationId });
    if (existingGuest) {
      return res.status(409).json({ error: 'Guest with this invitationId already exists' });
    }

    // Create new guest
    const guest = new Guest(body);
    await guest.save();

    return res.status(201).json(guest);
  } catch (error) {
    console.error('Error in POST /rsvp:', error);
    return res.status(500).json({ error: 'An error occurred while creating guest' });
  }
});

// Update existing guest
router.put('/', async (req, res) => {
  try {
    const { body } = req;
    const { invitationId } = body;

    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    // Remove invitationId from update data
    const { invitationId: _, ...updateFields } = body;

    // Prepare update operation
    const updateOperation = { $set: {} };

    // First, get the current document to check for null fields
    const currentGuest = await Guest.findOne({ invitationId });
    if (!currentGuest) {
      return res.status(404).json({ error: 'Guest not found' });
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
    processObject(updateFields, '', currentGuest);

    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Update fields:', JSON.stringify(updateFields, null, 2));
    console.log('Current document:', JSON.stringify(currentGuest, null, 2));
    console.log('Update operation:', JSON.stringify(updateOperation, null, 2));

    // Find and update the guest
    try {
      const updatedGuest = await updateRSVPAndRelatedReservations(invitationId, updateFields, updateOperation, coupleId);
      if (!updatedGuest) {
        return res.status(404).json({ error: 'Guest not found' });
      }
      return res.status(200).json({
        message: 'Guest updated successfully',
        guest: updatedGuest
      });
    } catch (error) {
      console.error('Error updating guest:', error);
      return res.status(error.statusCode || 500).json({ error: error.message || 'An error occurred while updating guest' });
    }
  } catch (error) {
    console.error('Error in PUT /rsvp:', error);
    return res.status(500).json({ error: 'An error occurred while updating guest' });
  }
});

export default router;
