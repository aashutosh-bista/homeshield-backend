import mongoose from "mongoose";

const serviceAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceArea = mongoose.model("ServiceArea", serviceAreaSchema);
