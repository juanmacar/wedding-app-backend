import mongoose from 'mongoose';

const LodgingAvailabilitySchema = new mongoose.Schema({
  weddingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
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
}, { collection: 'lodging_availability' });

const LodgingAvailability = mongoose.model('Lodging_Availability', LodgingAvailabilitySchema, 'lodging_availability');

export default LodgingAvailability;
