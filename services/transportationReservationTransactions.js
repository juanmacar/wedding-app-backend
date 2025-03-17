import mongoose from 'mongoose';
import TransportationReservation from '../models/TransportationReservation.js';
import Wedding from '../models/Wedding.js';

class TransportationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function updateReservationAndAvailability(invitationId, reservationData, weddingId, spotsDiff) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Update the wedding document's transportation availability
    const updatedWedding = await Wedding.findOneAndUpdate(
      {
        _id: weddingId,
        $expr: {
          $lte: [
            { $add: ['$transportation.takenSpots', spotsDiff] },
            '$transportation.totalSpots'
          ]
        }
      },
      { $inc: { 'transportation.takenSpots': spotsDiff } },
      { new: true, session }
    );

    if (!updatedWedding) {
      throw new TransportationError('Not enough transportation spots available', 409);
    }

    const updatedReservation = await TransportationReservation.findOneAndUpdate(
      { invitationId },
      reservationData,
      { new: true, session }
    );

    await session.commitTransaction();
    return {
      updatedReservation,
      updatedAvailability: {
        total_spots: updatedWedding.transportation.totalSpots,
        taken_spots: updatedWedding.transportation.takenSpots
      }
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof TransportationError) {
      throw error;
    }
    throw new TransportationError(error.message, 500);
  } finally {
    session.endSession();
  }
}

export async function createReservationAndUpdateAvailability(reservationData, weddingId, requiredSpots) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Update the wedding document's transportation availability
    const updatedWedding = await Wedding.findOneAndUpdate(
      {
        _id: weddingId,
        $expr: {
          $lte: [
            { $add: ['$transportation.takenSpots', requiredSpots] },
            '$transportation.totalSpots'
          ]
        }
      },
      { $inc: { 'transportation.takenSpots': requiredSpots } },
      { new: true, session }
    );

    if (!updatedWedding) {
      throw new TransportationError('Not enough transportation spots available', 409);
    }

    const newReservation = new TransportationReservation(reservationData);
    await newReservation.save({ session });

    await session.commitTransaction();
    return {
      newReservation,
      updatedAvailability: {
        total_spots: updatedWedding.transportation.totalSpots,
        taken_spots: updatedWedding.transportation.takenSpots
      }
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof TransportationError) {
      throw error;
    }
    throw new TransportationError(error.message, 500);
  } finally {
    session.endSession();
  }
}

export async function deleteReservationAndUpdateAvailability(invitationId, weddingId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find the reservation first to get the number of spots to release
    const transportationReservation = await TransportationReservation.findOne({ invitationId }).session(session);
    if (!transportationReservation) {
      throw new TransportationError('Transportation Reservation not found', 404);
    }

    const releasedSpots = transportationReservation.adults + transportationReservation.children;

    // Update the wedding document's transportation availability
    const updatedWedding = await Wedding.findOneAndUpdate(
      { _id: weddingId },
      { $inc: { 'transportation.takenSpots': -releasedSpots } },
      { new: true, session }
    );

    if (!updatedWedding) {
      throw new TransportationError('Failed to update transportation availability', 500);
    }

    // Delete the reservation
    await transportationReservation.deleteOne({ session });

    await session.commitTransaction();
    return {
      message: 'Transportation Reservation deleted successfully',
      releasedSpots,
      updatedAvailability: {
        total_spots: updatedWedding.transportation.totalSpots,
        taken_spots: updatedWedding.transportation.takenSpots
      }
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof TransportationError) {
      throw error;
    }
    throw new TransportationError(error.message, 500);
  } finally {
    session.endSession();
  }
}
