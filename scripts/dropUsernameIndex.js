import mongoose from 'mongoose';

async function dropUsernameIndex() {
  try {
    // Connect to your MongoDB database
    await mongoose.connect("mongodb+srv://juanmacarlupu:0CHSpJcccml08lAg@casamiento2025.2wsn6.mongodb.net/casamiento2025?retryWrites=true&w=majority&appName=Casamiento2025");
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