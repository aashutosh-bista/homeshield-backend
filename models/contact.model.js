import mongoose from "mongoose"

const contactSchema = new mongoose.Schema({
   
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength:100
    },
   
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match:[
             /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
        ]
    },
    phone:{
        type: String,
        trim: true,
        required: true,
    },
    // Links to a specific admin-created Service (e.g. "Flooring" under Renovation)
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 5000,
    },
     status: {
      type: String,
     enum: ["New", "Contacted", "Closed"],
      default: "New"
    },
    isRead: {
        type: Boolean,
        default: false,
    }
}, {timestamps: true})  
export const Contact = mongoose.model('Contact', contactSchema)