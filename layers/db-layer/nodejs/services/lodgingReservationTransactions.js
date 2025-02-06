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

        const updatedAvailability = await LodgingAvailability.findOneAndUpdate(
            {
                coupleId,
                $expr: { 
                    $lte: [
                        { $add: ["$taken_spots", spotsDiff] }, 
                        "$total_spots"
                    ]
                }
            },
            { $inc: { taken_spots: spotsDiff } },
            { new: true, session }
        );

        if (!updatedAvailability) {
            throw new LodgingError("Not enough spots available", 409);
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
                        { $add: ["$taken_spots", requiredSpots] }, 
                        "$total_spots"
                    ]
                }
            },
            { $inc: { taken_spots: requiredSpots } },
            { new: true, session }
        );

        if (!updatedAvailability) {
            throw new LodgingError("Not enough spots available", 409);
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