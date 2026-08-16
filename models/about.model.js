import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: "About Us" },
    description: { type: String, trim: true, default: "" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    // Free-form highlight bullets, e.g. "Licensed Civil Engineer", "10+ years experience"
    highlights: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const About = mongoose.model("About", aboutSchema);
