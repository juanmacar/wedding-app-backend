import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const copyCollectionData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get all documents from the guests collection
    const guests = await db.collection('guests').find({}).toArray();
    console.log(`Found ${guests.length} documents in guests collection`);

    // Insert them into the invitations collection
    if (guests.length > 0) {
      const result = await db.collection('invitations').insertMany(guests);
      console.log(`Successfully copied ${result.insertedCount} documents to invitations collection`);
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Error copying collection data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

copyCollectionData();
