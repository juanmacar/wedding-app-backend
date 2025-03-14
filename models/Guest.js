import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
  invitationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'couple', 'family']
  },
  mainGuest: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    attending: {
      type: Boolean,
      default: null
    }
  },
  hasCompanion: {
    type: Boolean,
    required: true,
    default: false
  },
  companion: {
    name: {
      type: String,
      trim: true,
      default: null
    },
    attending: {
      type: Boolean,
      default: null
    }
  },
  hasChildren: {
    type: Boolean,
    required: true,
    default: false
  },
  children: [{
    name: {
      type: String,
      trim: true
    },
    attending: {
      type: Boolean,
      default: null
    }
  }],
  dietaryRestrictionsInGroup: {
    type: String,
    default: null,
    trim: true
  },
  songRequest: {
    type: String,
    default: null,
    trim: true
  },
  additionalNotes: {
    type: String,
    default: null,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastModified: {
    type: Date,
    default: null
  }
}, { collection: 'guests' });

// Middleware to update lastModified on every save
guestSchema.pre('save', function (next) {
  this.lastModified = new Date();
  next();
});

const Guest = mongoose.model('Guest', guestSchema);

export default Guest;
