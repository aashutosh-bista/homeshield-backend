import mongoose from "mongoose"

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    guestCount: {
        type: Number,
        required: true,
        min: 1
    },

    venueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: true,
    },
    start: String,

    end: String,

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    commentBox: String,

}, {timestamps: true})

export const Booking = mongoose.model('Booking', bookingSchema)
