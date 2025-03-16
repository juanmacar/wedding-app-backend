import mongoose from 'mongoose';
import LodgingReservation from '../models/LodgingReservation.js';
import LodgingAvailability from '../models/LodgingAvailability.js';
import TransportationReservation from '../models/TransportationReservation.js';
import TransportationAvailability from '../models/TransportationAvailability.js';
import Guest from '../models/Guest.js';
import { RSVPError, LodgingError } from './errors.js';

export const updateRSVPAndRelatedReservations = async (invitationId, updateFields, updateOperation, coupleId) => {
  const allAttendees = [updateFields.mainGuest, updateFields.companion, ...(updateFields.children || [])].filter(Boolean);
  if (allAttendees.every((attendee) => attendee.attending === false)) {
    console.log('Nobody attending');
    try {
      const lodgingReservation = await LodgingReservation.findOne({ invitationId });
      const transportationReservation = await TransportationReservation.findOne({ invitationId });
      if (lodgingReservation || transportationReservation) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          if (lodgingReservation) {
            const releasedLodgingSpots = lodgingReservation.adults + lodgingReservation.children;
            const updatedLodgingAvailability = await LodgingAvailability.findOneAndUpdate(
              { coupleId },
              { $inc: { taken_spots: -releasedLodgingSpots } },
              { new: true, session }
            );
            if (!updatedLodgingAvailability) {
              throw new LodgingError('Failed to update availability', 500);
            }
            // Delete the lodging reservation
            await lodgingReservation.deleteOne({ session });
            console.log('Nobody attending, lodging reservation deleted');
          }
          if (transportationReservation) {
            const releasedTransportationSpots = transportationReservation.adults + transportationReservation.children;
            const updatedTransportationAvailability = await TransportationAvailability.findOneAndUpdate(
              { coupleId },
              { $inc: { taken_spots: -releasedTransportationSpots } },
              { new: true, session }
            );
            if (!updatedTransportationAvailability) {
              throw new LodgingError('Failed to update availability', 500);
            }
            // Delete the transportation reservation
            await transportationReservation.deleteOne({ session });
            console.log('Nobody attending, transportation reservation deleted');
          }
          const updatedGuest = await Guest.findOneAndUpdate(
            { invitationId },
            updateOperation,
            { new: true, runValidators: false, session }
          );
          await session.commitTransaction();
          session.endSession();
          return updatedGuest;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          throw new RSVPError('Ocurrió un error al actualizar la RSVP y borrar la reserva de alojamiento', 500);
        }
      }
      const updatedGuest = await Guest.findOneAndUpdate(
        { invitationId },
        updateOperation,
        { new: true, runValidators: false }
      );
      return updatedGuest;
    } catch (error) {
      throw new RSVPError('Ocurrió un error al actualizar la RSVP', 500);
    }
  } else {
    // At least one attendee is attending
    console.log('At least one attendee is attending');
    try {
      // Just update the guest RSVP information
      const updatedGuest = await Guest.findOneAndUpdate(
        { invitationId },
        updateOperation,
        { new: true, runValidators: false }
      );

      if (!updatedGuest) {
        throw new RSVPError('Guest not found', 404);
      }

      return updatedGuest;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      if (error instanceof RSVPError) {
        throw error;
      }
      throw new RSVPError('Ocurrió un error al actualizar la RSVP', 500);
    }
  }
};
