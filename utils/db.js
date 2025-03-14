import mongoose from 'mongoose';

let connection = null;

export const connectToDatabase = async (uri) => {
  // If there's an existing connection, check if it's ready
  if (connection && mongoose.connection.readyState === 1) {
    return connection;
  }

  // If there's a connection but it's not ready, disconnect first
  if (connection || mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (err) {
      console.log('Error disconnecting from previous connection:', err);
    }
    connection = null;
  }

  try {
    mongoose.set('strictQuery', false);
    connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // Timeout after 2 seconds
      socketTimeoutMS: 2000,
    });

    console.log('Successfully connected to MongoDB!');
    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export const closeConnection = async () => {
  if (connection || mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      connection = null;
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }
};
