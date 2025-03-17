import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  invitationId: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },
  weddingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
    required: true
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
}, { collection: 'invitations' });

// Middleware to update lastModified on every save
invitationSchema.pre('save', function (next) {
  this.lastModified = new Date();
  next();
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
