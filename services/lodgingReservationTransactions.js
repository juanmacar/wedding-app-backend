import mongoose from 'mongoose';
import LodgingReservation from '../models/LodgingReservation.js';
import LodgingAvailability from '../models/LodgingAvailability.js';

class LodgingError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function updateReservationAndAvailability(invitationId, reservationData, coupleId, spotsDiff) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log('spotsDiff:', spotsDiff);
    const updatedAvailability = await LodgingAvailability.findOneAndUpdate(
      {
        coupleId,
        $expr: {
          $lte: [
            { $add: ['$taken_spots', spotsDiff] },
            '$total_spots'
          ]
        }
      },
      { $inc: { taken_spots: spotsDiff } },
      { new: true, session }
    );
    console.log('updatedAvailability:', updatedAvailability);

    if (!updatedAvailability) {
      throw new LodgingError('Not enough spots available', 409);
    }

    const updatedReservation = await LodgingReservation.findOneAndUpdate(
      { invitationId },
      reservationData,
      { new: true, session }
    );

    await session.commitTransaction();
    return { updatedReservation, updatedAvailability };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof LodgingError) {
      throw error;
    }
    throw new LodgingError(error.message, 500);
  } finally {
    session.endSession();
  }
}

export async function createReservationAndUpdateAvailability(reservationData, coupleId, requiredSpots) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const updatedAvailability = await LodgingAvailability.findOneAndUpdate(
      {
        coupleId,
        $expr: {
          $lte: [
            { $add: ['$taken_spots', requiredSpots] },
            '$total_spots'
          ]
        }
      },
      { $inc: { taken_spots: requiredSpots } },
      { new: true, session }
    );

    if (!updatedAvailability) {
      throw new LodgingError('Not enough spots available', 409);
    }

    const newReservation = new LodgingReservation(reservationData);
    await newReservation.save({ session });

    await session.commitTransaction();
    return { newReservation, updatedAvailability };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof LodgingError) {
      throw error;
    }
    throw new LodgingError(error.message, 500);
  } finally {
    session.endSession();
  }
}

export async function deleteReservationAndUpdateAvailability(invitationId, coupleId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find the reservation first to get the number of spots to release
    const lodgingReservation = await LodgingReservation.findOne({ invitationId }).session(session);
    if (!lodgingReservation) {
      throw new LodgingError('Lodging Reservation not found', 404);
    }

    const releasedSpots = lodgingReservation.adults + lodgingReservation.children;

    // Update availability
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

    await session.commitTransaction();
    return { message: 'Lodging Reservation deleted successfully', releasedSpots };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof LodgingError) {
      throw error;
    }
    throw new LodgingError(error.message, 500);
  } finally {
    session.endSession();
  }
}
