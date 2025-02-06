import mongoose from 'mongoose';

const TransportationReservationSchema = new mongoose.Schema({
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
}, { collection: 'transportation_reservations' });

// Define the static method directly on the schema
TransportationReservationSchema.statics.findByInvitationId = async function(invitationId) {
    console.log('Searching for transportation reservation with invitationId:', invitationId);
    const transportationReservation = await this.findOne({ invitationId });
    console.log('Found transportation reservation:', transportationReservation);
    return transportationReservation;
};

const TransportationReservation = mongoose.model('Transportation_Reservation', TransportationReservationSchema);

export default TransportationReservation;