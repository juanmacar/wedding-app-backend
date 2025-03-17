import mongoose from 'mongoose';
import LodgingReservation from '../models/LodgingReservation.js';
import Wedding from '../models/Wedding.js';

class LodgingError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function updateReservationAndAvailability(invitationId, reservationData, weddingId, spotsDiff) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log('spotsDiff:', spotsDiff);

    // Update the wedding document's lodging availability
    const updatedWedding = await Wedding.findOneAndUpdate(
      {
        _id: weddingId,
        $expr: {
          $lte: [
            { $add: ['$lodging.takenSpots', spotsDiff] },
            '$lodging.totalSpots'
          ]
        }
      },
      { $inc: { 'lodging.takenSpots': spotsDiff } },
      { new: true, session }
    );

    console.log('updatedWedding lodging:', updatedWedding?.lodging);

    if (!updatedWedding) {
      throw new LodgingError('Not enough lodging spots available', 409);
    }

    const updatedReservation = await LodgingReservation.findOneAndUpdate(
      { invitationId },
      reservationData,
      { new: true, session }
    );

    await session.commitTransaction();
    return {
      updatedReservation,
      updatedAvailability: {
        total_spots: updatedWedding.lodging.totalSpots,
        taken_spots: updatedWedding.lodging.takenSpots
      }
    };
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

export async function createReservationAndUpdateAvailability(reservationData, weddingId, requiredSpots) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Update the wedding document's lodging availability
    const updatedWedding = await Wedding.findOneAndUpdate(
      {
        _id: weddingId,
        $expr: {
          $lte: [
            { $add: ['$lodging.takenSpots', requiredSpots] },
            '$lodging.totalSpots'
          ]
        }
      },
      { $inc: { 'lodging.takenSpots': requiredSpots } },
      { new: true, session }
    );

    if (!updatedWedding) {
      throw new LodgingError('Not enough lodging spots available', 409);
    }

    const newReservation = new LodgingReservation(reservationData);
    await newReservation.save({ session });

    await session.commitTransaction();
    return {
      newReservation,
      updatedAvailability: {
        total_spots: updatedWedding.lodging.totalSpots,
        taken_spots: updatedWedding.lodging.takenSpots
      }
    };
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

export async function deleteReservationAndUpdateAvailability(invitationId, weddingId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find the reservation first to get the number of spots to release
    const lodgingReservation = await LodgingReservation.findOne({ invitationId }).session(session);
    if (!lodgingReservation) {
      throw new LodgingError('Lodging Reservation not found', 404);
    }

    const releasedSpots = lodgingReservation.adults + lodgingReservation.children;

    // Update the wedding document's lodging availability
    const updatedWedding = await Wedding.findOneAndUpdate(
      { _id: weddingId },
      { $inc: { 'lodging.takenSpots': -releasedSpots } },
      { new: true, session }
    );

    if (!updatedWedding) {
      throw new LodgingError('Failed to update lodging availability', 500);
    }

    // Delete the reservation
    await lodgingReservation.deleteOne({ session });

    await session.commitTransaction();
    return {
      message: 'Lodging Reservation deleted successfully',
      releasedSpots,
      updatedAvailability: {
        total_spots: updatedWedding.lodging.totalSpots,
        taken_spots: updatedWedding.lodging.takenSpots
      }
    };
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
