import Guest from '../models/Guest.js';
import LodgingReservation from '../models/LodgingReservation.js';
import TransportationReservation from '../models/TransportationReservation.js';
import LodgingAvailability from '../models/LodgingAvailability.js';
import TransportationAvailability from '../models/TransportationAvailability.js';

const totalLodgingSpots = 70;
const totalTransportationSpots = 70;
const coupleId = '0001';
export const initializeDatabase = async () => {
  try {
    // Initialize collections by making a simple query to  create the collections if they don't exist
    await Guest.findOne({});
    await LodgingReservation.findOne({});
    await TransportationReservation.findOne({});
    console.log('Collections initialized successfully');

    // Check if the availability document exists
    const lodgingAvailabilityDoc = await LodgingAvailability.findOne({});

    if (!lodgingAvailabilityDoc) {
      const availability = new LodgingAvailability({
        coupleId,
        total_spots: totalLodgingSpots,
        taken_spots: 0
      });
      await availability.save();
      console.log('Created lodging availability document');
    }

    const transportationAvailabilityDoc = await TransportationAvailability.findOne({});

    if (!transportationAvailabilityDoc) {
      const availability = new TransportationAvailability({
        coupleId,
        total_spots: totalTransportationSpots,
        taken_spots: 0
      });
      await availability.save();
      console.log('Created transportation availability document');
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
