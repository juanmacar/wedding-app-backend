import mongoose from 'mongoose';
import LodgingReservation from '../models/LodgingReservation.js';
import LodgingAvailability from '../models/LodgingAvailability.js';
import Guest from '../models/Guest.js';

export const updateRSVPAndRelatedReservations = async (invitationId, updateFields, updateOperation, coupleId) => {
const session = await mongoose.startSession();
session.startTransaction();
try {
    const allAttendees = [updateFields.mainGuest, updateFields.companion, ...(updateFields.children || [])].filter(Boolean);
    if (allAttendees.every(attendee => attendee.attending === false)) {
        console.log('Nobody attending');
        // Start the process of deleting the lodging reservation for this guest
        const lodgingReservation = await LodgingReservation.findOne({ invitationId }).session(session);
        if (!lodgingReservation) {
            throw new LodgingError('Lodging Reservation not found', 404);
        }

        const releasedSpots = lodgingReservation.adults + lodgingReservation.children;

        // Update lodging availability
        const updatedAvailability = await LodgingAvailability.findOneAndUpdate(
            { coupleId },
            { $inc: { taken_spots: -releasedSpots } },
            { new: true, session }
        );

        if (!updatedAvailability) {
            throw new LodgingError('Failed to update availability', 500);
        }

        // Delete the reservation
        await lodgingReservation.deleteOne({ session });
        console.log('Nobody attending, lodging reservation deleted');
    }

    const updatedGuest = await Guest.findOneAndUpdate(
        { invitationId },
        updateOperation,
        { new: true, runValidators: false }
    );
    
    await session.commitTransaction();
    session.endSession();
    console.log('Transaction committed');
    return updatedGuest;

    } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log('Transaction aborted');
    throw error;
    }
};