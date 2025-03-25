import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const updateTransportationIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Drop the old index on guestId
    console.log('Dropping old index on guestId...');
    await db.collection('transportation_reservations').dropIndex('guestId_1');
    console.log('Old index dropped successfully');

    // Create a new unique index on invitationId
    console.log('Creating new index on invitationId...');
    await db.collection('transportation_reservations').createIndex({ invitationId: 1 }, { unique: true });
    console.log('New index created successfully');

    console.log('Transportation indexes updated successfully');
  } catch (error) {
    console.error('Error updating transportation indexes:', error);
    // If the index doesn't exist, that's okay
    if (error.code === 27) {
      console.log('Index does not exist, which is fine');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateTransportationIndexes();
