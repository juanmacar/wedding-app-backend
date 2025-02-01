import Guest from '../models/Guest.js';
import LodgingReservation from '../models/LodgingReservation.js';
import TransportationReservation from '../models/TransportationReservation.js';
import LodgingAvailability from '../models/LodgingAvailability.js';

export const initializeDatabase = async () => {
    try {
        // Initialize collections by making a simple query
        // This will create the collections if they don't exist
        await Guest.findOne({});
        await LodgingReservation.findOne({});
        await TransportationReservation.findOne({});
        console.log('Collections initialized successfully');

        // Check if the availability document exists
        const availabilityDoc = await LodgingAvailability.findOne({});

        if (!availabilityDoc) {
            const availability = new LodgingAvailability({
                total_spots: 0,
                taken_spots: 0
            });
            await availability.save();
            console.log('Created lodging availability document');
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};