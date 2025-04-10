// models/Wedding.js
import mongoose from 'mongoose';

const weddingSchema = new mongoose.Schema({
  // Wedding details
  weddingDate: {
    type: Date,
    required: false
  },
  weddingName: {
    type: String,
    required: true,
    trim: true
  },
  // Associated users (could be both partners, wedding planner, etc.)
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Additional wedding details
  venue: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  },
  // Lodging information
  lodging: {
    totalSpots: {
      type: Number,
      default: 0
    },
    takenSpots: {
      type: Number,
      default: 0
    },
    // For future implementation - room distribution
    rooms: [{
      name: {
        type: String,
        trim: true
      },
      capacity: {
        type: Number
      },
      quantity: {
        type: Number
      },
      description: {
        type: String,
        trim: true
      }
    }]
  },
  // Transportation information
  transportation: {
    totalSpots: {
      type: Number,
      default: 0
    },
    takenSpots: {
      type: Number,
      default: 0
    },
    // For future implementation - transportation options
    options: [{
      name: {
        type: String,
        trim: true
      },
      capacity: {
        type: Number
      },
      quantity: {
        type: Number
      },
      description: {
        type: String,
        trim: true
      }
    }]
  },
  // Any additional settings or preferences
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Wedding = mongoose.model('Wedding', weddingSchema);

export default Wedding;
