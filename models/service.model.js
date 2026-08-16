import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: [true, "A service must belong to a category"],
      index: true,
    },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    price: { type: String, trim: true, default: "" },
    ideal: { type: String, trim: true, default: "" },
    includes: { type: [String], default: [] },
    youtubeUrl: { type: String, trim: true, default: "" },
    youtubeVideoId: { type: String, trim: true, default: "" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Service = mongoose.model("Service", serviceSchema);
