import mongoose from 'mongoose';

const LodgingReservationSchema = new mongoose.Schema({
    invitationId: {
        type: String,
        required: true,
        unique: true,
        trim: true
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

const LodgingReservation = mongoose.model('Lodging_Reservation', LodgingReservationSchema);

export default LodgingReservation;