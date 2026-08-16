import mongoose from "mongoose"

const phoneSchema = new mongoose.Schema({
    label: {
        type: String,
        trim: true,
        default: "Office"
    },
    number: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
    },
    isPrimary: {
        type: Boolean,
        default: false,
    }
}, { _id: false })

const emailSchema = new mongoose.Schema({
    label: {
        type: String,
        trim: true,
        default: "General"
    },
    address: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email",
        ]
    },
    isPrimary: {
        type: Boolean,
        default: false,
    }
}, { _id: false })

const settingSchema = new mongoose.Schema({

    companyName: {
        type: String,
        trim: true,
        maxlength: 150,
        default: ""
    },

    phones: {
        type: [phoneSchema],
        default: [],
    },

    emails: {
        type: [emailSchema],
        default: [],
    },

    address: {
        street: { type: String, trim: true, default: "" },
        city: { type: String, trim: true, default: "" },
        state: { type: String, trim: true, default: "" },
        zip: { type: String, trim: true, default: "" },
        country: { type: String, trim: true, default: "" },
    },

    map: {
        embedUrl: { type: String, trim: true, default: "" },
    },

    socialLinks: {
        facebook: { type: String, trim: true, default: "" },
        instagram: { type: String, trim: true, default: "" },
        linkedin: { type: String, trim: true, default: "" },
        twitter: { type: String, trim: true, default: "" },
    },

}, { timestamps: true })

export const Setting = mongoose.model('Setting', settingSchema)