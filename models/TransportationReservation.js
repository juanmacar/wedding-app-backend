import mongoose from 'mongoose';

const TransportationReservationSchema = new mongoose.Schema({
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
}, { collection: 'transportation_reservations' });

const TransportationReservation = mongoose.model('Transportation_Reservation', TransportationReservationSchema);

export default TransportationReservation;
