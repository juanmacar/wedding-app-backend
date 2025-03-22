import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invitation from '../models/Invitation.js';

dotenv.config();
// Connect to your MongoDB database
await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const removePhoneField = async () => {
  try {
    // Update all invitations to remove the phone field from mainGuest
    const result = await Invitation.updateMany(
      { 'mainGuest.phone': { $exists: true } },
      { $unset: { 'mainGuest.phone': '' } }
    );
    console.log(result);
    console.log(`Successfully updated ${result.nModified} invitations.`);
  } catch (error) {
    console.error('Error updating invitations:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the script
removePhoneField();
