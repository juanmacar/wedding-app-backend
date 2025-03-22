import mongoose from 'mongoose';
import Invitation from '../models/Invitation.js';

/**
 * Processes guest data to create invitation documents
 * @param {string} weddingId - The wedding ID
 * @param {Array} guestData - Array of objects containing guest information
 * @returns {Promise<Array>} - Array of created invitation documents
 */
export async function createInvitationsFromGuestData(weddingId, guestData) {
  if (!weddingId || !mongoose.Types.ObjectId.isValid(weddingId)) {
    throw new Error('Invalid wedding ID');
  }

  if (!Array.isArray(guestData) || guestData.length === 0) {
    throw new Error('Guest data must be a non-empty array');
  }

  // Sort guest data by group to ensure we process each group together
  const sortedGuestData = [...guestData].sort((a, b) => a.group - b.group);

  const invitations = [];
  let currentInvitation = null;
  let currentGroup = null;

  // Function to finalize and save the current invitation
  const finalizeInvitation = async () => {
    if (currentInvitation) {
      // Set invitation type based on group composition
      if (currentInvitation.hasChildren) {
        currentInvitation.type = 'family';
      } else if (currentInvitation.hasCompanion) {
        currentInvitation.type = 'couple';
      } else {
        currentInvitation.type = 'single';
        // Ensure companion is null for single invitations
        currentInvitation.companion = null;
      }

      // Create and save the invitation document
      const invitation = new Invitation(currentInvitation);
      await invitation.save();
      invitations.push(invitation);
    }
  };

  // Process each guest
  for (const guest of sortedGuestData) {
    const {
      guestName, guestType, group, phone
    } = guest;

    // If we're starting a new group
    if (currentGroup !== group) {
      // Finalize the previous invitation if it exists
      await finalizeInvitation();

      // Start a new invitation
      currentInvitation = {
        weddingId,
        songRequest: '',
        dietaryRestrictionsInGroup: '',
        additionalNotes: '',
        hasCompanion: false,
        hasChildren: false,
        children: [],
        sent: false,
        phone: phone || null,
        companion: null,
        mainGuest: null
      };

      currentGroup = group;
    }

    // Add the guest to the appropriate field in the invitation
    if (guestType.toLowerCase() === 'adulto') {
      if (!currentInvitation.mainGuest) {
        // First adult is the main guest
        currentInvitation.mainGuest = { name: guestName, attending: null };
      } else if (!currentInvitation.hasCompanion) {
        // Second adult is the companion
        currentInvitation.hasCompanion = true;
        currentInvitation.companion = { name: guestName, attending: null };
      }
    } else if (guestType.toLowerCase().startsWith('niñ')) {
      // Guest is a child
      currentInvitation.hasChildren = true;
      currentInvitation.children.push({ name: guestName, attending: null });
    }

    // Update phone if it was provided
    if (phone && !currentInvitation.phone) {
      currentInvitation.phone = phone;
    }
  }

  // Finalize the last invitation
  await finalizeInvitation();

  return invitations;
}

/**
 * Creates an invitation document from individual guest data
 * @param {string} weddingId - The wedding ID
 * @param {string} guestName - The guest's name
 * @param {string} guestType - The guest type (adult or child)
 * @param {number|string} group - The group number or identifier
 * @param {string} phone - Contact phone number
 * @returns {Promise<Object>} - The created or updated invitation
 */
export async function processGuest(weddingId, guestName, guestType, group, phone) {
  if (!weddingId || !mongoose.Types.ObjectId.isValid(weddingId)) {
    throw new Error('Invalid wedding ID');
  }

  if (!guestName || !guestType || group === undefined) {
    throw new Error('Missing required guest information');
  }

  // Check if an invitation already exists for this group
  let invitation = await Invitation.findOne({
    weddingId,
    $or: [
      { 'mainGuest.name': { $regex: new RegExp(`^${guestName}$`, 'i') } },
      { 'companion.name': { $regex: new RegExp(`^${guestName}$`, 'i') } },
      { 'children.name': { $regex: new RegExp(`^${guestName}$`, 'i') } }
    ]
  });

  // If no invitation exists with this guest, check by group
  if (!invitation) {
    // Find existing invitation for this group
    invitation = await Invitation.findOne({
      weddingId,
      _id: {
        $in: (await Invitation.find({ weddingId }))
          .filter((inv) =>
          // Look for any guest in this invitation who is in the same group
          // This requires additional logic that would depend on how groups are stored
            inv._id // Placeholder, actual implementation would vary
          )
          .map((inv) => inv._id)
      }
    });
  }

  // Create new invitation if none exists
  if (!invitation) {
    invitation = new Invitation({
      weddingId,
      songRequest: '',
      dietaryRestrictionsInGroup: '',
      additionalNotes: '',
      hasCompanion: false,
      hasChildren: false,
      children: [],
      sent: false,
      phone: phone || null,
      mainGuest: { name: guestName, attending: null },
      type: 'single' // Will be updated based on group composition
    });
  } else {
    // Update existing invitation based on guest type
    if (guestType.toLowerCase() === 'adult') {
      if (!invitation.mainGuest.name) {
        invitation.mainGuest = { name: guestName, attending: null };
      } else if (!invitation.companion.name) {
        invitation.hasCompanion = true;
        invitation.companion = { name: guestName, attending: null };
        invitation.type = invitation.hasChildren ? 'family' : 'couple';
      }
    } else if (guestType.toLowerCase() === 'child') {
      invitation.hasChildren = true;
      invitation.children.push({ name: guestName, attending: null });
      invitation.type = 'family';
    }

    // Update phone if it was provided and not set already
    if (phone && !invitation.phone) {
      invitation.phone = phone;
    }
  }

  await invitation.save();
  return invitation;
}
