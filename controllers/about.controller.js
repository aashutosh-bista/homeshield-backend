import { About } from "../models/about.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// There is only ever one About document. Create it on first read if missing.
const getOrCreateAbout = async () => {
  let about = await About.findOne();
  if (!about) {
    about = await About.create({});
  }
  return about;
};

// GET /api/v1/about  (public)
export const getAbout = asyncHandler(async (req, res) => {
  const about = await getOrCreateAbout();
  return res.status(200).json(new ApiResponse(200, about, "About content fetched successfully."));
});

// PUT /api/v1/about/admin  (admin, multipart)
export const updateAbout = asyncHandler(async (req, res) => {
  const about = await getOrCreateAbout();

  const { heading, description } = req.body;
  if (heading !== undefined) about.heading = heading.trim();
  if (description !== undefined) about.description = description.trim();

  if (req.body.highlights !== undefined) {
    let highlights = [];
    try {
      const parsed = JSON.parse(req.body.highlights);
      if (Array.isArray(parsed)) highlights = parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      highlights = String(req.body.highlights).split("\n").map((s) => s.trim()).filter(Boolean);
    }
    about.highlights = highlights;
  }

  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload image.");
    if (about.image?.publicId) await deleteFromCloudinary(about.image.publicId);
    about.image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  await about.save();
  return res.status(200).json(new ApiResponse(200, about, "About content updated successfully."));
});
