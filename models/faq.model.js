import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: [true, "Question is required"], trim: true, maxlength: 300 },
    answer: { type: String, required: [true, "Answer is required"], trim: true, maxlength: 3000 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faq = mongoose.model("Faq", faqSchema);
