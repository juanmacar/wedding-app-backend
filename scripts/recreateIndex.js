import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = 'mongodb+srv://juanmacarlupu:0CHSpJcccml08lAg@casamiento2025.2wsn6.mongodb.net/casamiento2025?retryWrites=true&w=majority&appName=Casamiento2025';

const recreateIndex = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');

    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('lodging_reservations');

    // Check if the index exists and drop it if it does
    const indexInfo = await collection.indexInformation();
    if (indexInfo.invitationId_1) {
      console.log('Found existing index on invitationId, dropping it...');
      await collection.dropIndex('invitationId_1');
      console.log('Index dropped successfully');
    }

    // Create the unique index
    console.log('Creating unique index on invitationId...');
    await collection.createIndex({ invitationId: 1 }, { unique: true });
    console.log('Index created successfully');

    console.log('Index recreation completed');
  } catch (error) {
    console.error('Error recreating index:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

recreateIndex();
