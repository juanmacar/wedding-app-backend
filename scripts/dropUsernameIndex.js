import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function dropUsernameIndex() {
  try {
    // Connect to your MongoDB database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the users collection
    const usersCollection = mongoose.connection.collection('users');

    // Drop the index
    await usersCollection.dropIndex('username_1');
    console.log('Successfully dropped username_1 index');
  } catch (error) {
    console.error('Error dropping index:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

dropUsernameIndex();
