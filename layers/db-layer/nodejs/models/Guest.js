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
guestSchema.pre('save', function(next) {
    this.lastModified = new Date();
    next();
});

// Method to check if all guests have responded
guestSchema.methods.isComplete = function() {
    if (this.mainGuest.attending === null) return false;
    if (this.hasCompanion && this.companion.attending === null) return false;
    if (this.hasChildren && this.children.some(child => child.attending === null)) return false;
    return true;
};

// Virtual for getting total guests in invitation
guestSchema.virtual('totalGuests').get(function() {
    let count = this.mainGuest.attending ? 1 : 0;
    if (this.hasCompanion && this.companion?.attending) count++;
    if (this.hasChildren && this.children) {
        count += this.children.filter(child => child.attending).length;
    }
    return count;
});

// Static method to find guest by invitation ID
guestSchema.statics.findByInvitationId = async function(invitationId) {
    console.log('Searching for guest with invitationId:', invitationId);
    const guest = await this.findOne({ invitationId });
    console.log('Found guest:', guest);
    return guest;
};

// Static method to get total confirmed attendees
guestSchema.statics.getTotalConfirmedAttendees = async function() {
    const guests = await this.find({ confirmed: true });
    return guests.reduce((total, guest) => {
        let count = guest.mainGuest.attending ? 1 : 0;
        if (guest.hasCompanion && guest.companion.attending) count++;
        if (guest.hasChildren) {
            count += guest.children.filter(child => child.attending).length;
        }
        return total + count;
    }, 0);
};

const Guest = mongoose.model('Guest', guestSchema);

export default Guest;
