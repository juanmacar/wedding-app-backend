import mongoose from 'mongoose';
import TransportationReservation from '../models/TransportationReservation.js';
import TransportationAvailability from '../models/TransportationAvailability.js';

class TransportationError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export async function updateReservationAndAvailability(invitationId, reservationData, coupleId, spotsDiff) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const updatedAvailability = await TransportationAvailability.findOneAndUpdate(
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
            throw new TransportationError("Not enough spots available", 409);
        }

        const updatedReservation = await TransportationReservation.findOneAndUpdate(
            { invitationId },
            reservationData,
            { new: true, session }
        );

        await session.commitTransaction();
        return { updatedReservation, updatedAvailability };
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

export async function createReservationAndUpdateAvailability(reservationData, coupleId, requiredSpots) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const updatedAvailability = await TransportationAvailability.findOneAndUpdate(
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
            throw new TransportationError("Not enough spots available", 409);
        }

        const newReservation = new TransportationReservation(reservationData);
        await newReservation.save({ session });

        await session.commitTransaction();
        return { newReservation, updatedAvailability };
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