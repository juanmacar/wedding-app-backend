import mongoose from 'mongoose';
import LodgingReservation from '../models/LodgingReservation.js';
import TransportationReservation from '../models/TransportationReservation.js';
import Invitation from '../models/Invitation.js';
import Wedding from '../models/Wedding.js';
import { RSVPError, LodgingError } from './errors.js';

export const updateRSVPAndRelatedReservations = async (invitationId, updateFields, updateOperation) => {
  const allAttendees = [updateFields.mainGuest, updateFields.companion, ...(updateFields.children || [])].filter(Boolean);
  if (allAttendees.every((attendee) => attendee.attending === false)) {
    console.log('Nobody attending');
    try {
      // First, get the invitation to retrieve the wedding ID
      const invitation = await Invitation.findById(invitationId);
      console.log('invitation', invitation);
      if (!invitation) {
        throw new RSVPError('Guest not found', 404);
      }

      // Check if weddingId exists before trying to use it
      if (!invitation.weddingId) {
        throw new RSVPError('Wedding ID not found in invitation', 400);
      }

      const weddingId = invitation.weddingId.toString();
      console.log('weddingId', weddingId);

      // Find reservations using the invitation's _id
      const lodgingReservation = await LodgingReservation.findOne({ invitationId });
      const transportationReservation = await TransportationReservation.findOne({ invitationId });

      if (lodgingReservation || transportationReservation) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          if (lodgingReservation) {
            const releasedLodgingSpots = lodgingReservation.adults + lodgingReservation.children;
            const updatedWedding = await Wedding.findOneAndUpdate(
              { _id: weddingId },
              { $inc: { 'lodging.takenSpots': -releasedLodgingSpots } },
              { new: true, session }
            );
            if (!updatedWedding) {
              throw new LodgingError('Failed to update availability', 500);
            }
            // Delete the lodging reservation
            await lodgingReservation.deleteOne({ session });
            console.log('Nobody attending, lodging reservation deleted');
          }
          if (transportationReservation) {
            const releasedTransportationSpots = transportationReservation.adults + transportationReservation.children;
            const updatedWedding = await Wedding.findOneAndUpdate(
              { _id: weddingId },
              { $inc: { 'transportation.takenSpots': -releasedTransportationSpots } },
              { new: true, session }
            );
            if (!updatedWedding) {
              throw new LodgingError('Failed to update availability', 500);
            }
            // Delete the transportation reservation
            await transportationReservation.deleteOne({ session });
            console.log('Nobody attending, transportation reservation deleted');
          }
          // Update the invitation using its _id
          const updatedInvitation = await Invitation.findByIdAndUpdate(
            invitationId,
            updateOperation,
            { new: true, runValidators: false, session }
          );
          await session.commitTransaction();
          session.endSession();
          return updatedInvitation;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          throw new RSVPError('Ocurrió un error al actualizar la RSVP y borrar la reserva de alojamiento', 500);
        }
      }
      // If no reservations exist, just update the invitation
      const updatedInvitation = await Invitation.findByIdAndUpdate(
        invitationId,
        updateOperation,
        { new: true, runValidators: false }
      );
      return updatedInvitation;
    } catch (error) {
      throw new RSVPError('Ocurrió un error al actualizar la RSVP', 500);
    }
  } else {
    // At least one attendee is attending
    console.log('At least one attendee is attending');
    try {
      // Just update the invitation RSVP information using its _id
      const updatedInvitation = await Invitation.findByIdAndUpdate(
        invitationId,
        updateOperation,
        { new: true, runValidators: false }
      );

      if (!updatedInvitation) {
        throw new RSVPError('Guest not found', 404);
      }

      return updatedInvitation;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      if (error instanceof RSVPError) {
        throw error;
      }
      throw new RSVPError('Ocurrió un error al actualizar la RSVP', 500);
    }
  }
};
