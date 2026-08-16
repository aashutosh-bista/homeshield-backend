import mongoose from "mongoose";

const cloudinaryAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const youtubeVideoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    videoId: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: 500,
    },
    body: {
      type: String,
      required: [true, "Body is required"],
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    author: {
      type: String,
      trim: true,
      default: "HomeShield Consulting",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    // Single cover/thumbnail image shown on blog cards
    featuredImage: {
      type: cloudinaryAssetSchema,
      default: null,
    },
    // Gallery of images rendered as a slider on the post page
    images: {
      type: [cloudinaryAssetSchema],
      default: [],
    },
    // YouTube videos embedded on the post page
    youtubeVideos: {
      type: [youtubeVideoSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", excerpt: "text", category: "text" });

export const Blog = mongoose.model("Blog", blogSchema);
