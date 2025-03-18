import mongoose from 'mongoose';

const LodgingReservationSchema = new mongoose.Schema({
  invitationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation',
    required: true,
    unique: true
  },
  guests: {
    type: Array,
    required: true,
  },
  adults: {
    type: Number,
    required: false
  },
  children: {
    type: Number,
    required: false
  }
}, { collection: 'lodging_reservations' });

// Try to get the existing model first, or create a new one if it doesn't exist
const LodgingReservation = mongoose.model('Lodging_Reservation', LodgingReservationSchema);

export default LodgingReservation;
