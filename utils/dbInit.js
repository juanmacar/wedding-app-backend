import Invitation from '../models/Invitation.js';
import LodgingReservation from '../models/LodgingReservation.js';
import TransportationReservation from '../models/TransportationReservation.js';
import User from '../models/User.js';
import Wedding from '../models/Wedding.js';

export const initializeDatabase = async () => {
  try {
    // Initialize collections by making a simple query to create the collections if they don't exist
    await Invitation.findOne({});
    await LodgingReservation.findOne({});
    await TransportationReservation.findOne({});
    await User.findOne({});
    await Wedding.findOne({});
    console.log('Collections initialized successfully');

    // Check if admin user exists and create one if environment variables are set
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const adminExists = await User.findOne({ email: adminEmail, isAdmin: true });

      if (!adminExists) {
        const adminUser = new User({
          email: adminEmail,
          password: adminPassword,
          isAdmin: true,
          isVenue: false
        });

        await adminUser.save();
        console.log('Created admin user');
      }
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
