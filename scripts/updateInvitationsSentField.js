import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invitation from '../models/Invitation.js';

// Load environment variables
dotenv.config();

// Main function to update invitations
const updateInvitations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Add 'sent' field at the top level with a default value of false
    const result = await Invitation.updateMany(
      { sent: { $exists: false } }, // Only update documents where 'sent' does not exist
      { $set: { sent: false } }
    );

    console.log(`Added 'sent: false' to ${result.modifiedCount} invitations`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating invitations:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// Run the function
updateInvitations();
