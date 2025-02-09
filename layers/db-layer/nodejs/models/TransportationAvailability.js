import mongoose from 'mongoose';

const TransportationAvailabilitySchema = new mongoose.Schema({
    coupleId: {
        type: String,
        required: true
    },
    total_spots: {
        type: Number,
        required: true,
    },
    taken_spots: {
        type: Number,
        required: true
    }
}, { collection: 'transportation_availability' });

const TransportationAvailability = mongoose.model('Transportation_Availability', TransportationAvailabilitySchema, 'transportation_availability');

export default TransportationAvailability;