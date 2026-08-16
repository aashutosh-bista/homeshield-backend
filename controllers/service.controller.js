import { Service } from "../models/service.model.js";
import { ServiceCategory } from "../models/serviceCategory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { slugify, ensureUniqueSlug } from "../utils/slugify.js";
import fs from "fs";
import { extractYoutubeId } from "../utils/youtube.js";
const cleanupTempFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlink(file.path, () => {});
};
const parseYoutubeField = (url) => {
  const trimmed = (url || "").trim();
  if (!trimmed) return { youtubeUrl: "", youtubeVideoId: "" };
  const videoId = extractYoutubeId(trimmed);
  if (!videoId)
    throw new ApiError(400, `"${trimmed}" is not a valid YouTube link.`);
  return { youtubeUrl: trimmed, youtubeVideoId: videoId };
};
const parseIncludes = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw))
    return raw.map((s) => String(s).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {
    // fall through — treat as newline separated
  }
  return String(raw)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
};

// GET /api/v1/services?category=  (public) — flat list, optionally tag-filtered by category slug
export const getServices = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) {
    const category = await ServiceCategory.findOne({
      slug: req.query.category,
    });
    if (!category)
      return res
        .status(200)
        .json(
          new ApiResponse(200, [], "Service categories fetched successfully."),
        );
    filter.category = category._id;
  }
  const services = await Service.find(filter)
    .populate("category", "name slug")
    .sort({ order: 1, createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, services, "Services fetched successfully."));
});

// GET /api/v1/services/slug/:slug  (public)
export const getServiceBySlug = asyncHandler(async (req, res) => {
  const service = await Service.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate("category", "name slug");
  if (!service) throw new ApiError(404, "Service not found.");

  const related = await Service.find({
    category: service.category._id,
    _id: { $ne: service._id },
    isActive: true,
  }).limit(4);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { service, related },
        "Service fetched successfully.",
      ),
    );
});

// GET /api/v1/services/admin/all  (admin)
export const getAllServicesAdmin = asyncHandler(async (req, res) => {
  const services = await Service.find()
    .populate("category", "name slug")
    .sort({ order: 1, createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, services, "Services fetched successfully."));
});

// GET /api/v1/services/admin/:id  (admin)
export const getServiceByIdAdmin = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    "category",
    "name slug",
  );
  if (!service) throw new ApiError(404, "Service not found.");
  return res
    .status(200)
    .json(new ApiResponse(200, service, "Service fetched successfully."));
});

// POST /api/v1/services/admin  (admin, multipart)
export const createService = asyncHandler(async (req, res) => {
  const { title, description, price, ideal, category, order, isActive } =
    req.body;

  if (!title?.trim() || !category) {
    cleanupTempFile(req.file);
    throw new ApiError(400, "Title and category are required.");
  }

  const categoryDoc = await ServiceCategory.findById(category);
  if (!categoryDoc) {
    cleanupTempFile(req.file);
    throw new ApiError(400, "That category doesn't exist.");
  }

  const baseSlug = slugify(req.body.slug?.trim() || title);
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) =>
    Boolean(await Service.findOne({ slug: candidate })),
  );

  let image = { url: "", publicId: "" };
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload image.");
    image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }
  const { youtubeUrl, youtubeVideoId } = parseYoutubeField(req.body.youtubeUrl);
  const service = await Service.create({
    title: title.trim(),
    slug,
    youtubeUrl,
    youtubeVideoId,
    category: categoryDoc._id,
    description: description?.trim() || "",
    price: price?.trim() || "",
    ideal: ideal?.trim() || "",
    includes: parseIncludes(req.body.includes),
    image,
    order: Number(order) || 0,
    isActive:
      isActive === undefined ? true : isActive === "true" || isActive === true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, service, "Service created successfully."));
});

// PUT /api/v1/services/admin/:id  (admin, multipart)
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    cleanupTempFile(req.file);
    throw new ApiError(404, "Service not found.");
  }

  const {
    title,
    description,
    price,
    ideal,
    category,
    order,
    isActive,
    slug: newSlugRaw,
  } = req.body;

  if (title !== undefined) service.title = title.trim();
  if (req.body.youtubeUrl !== undefined) {
    const { youtubeUrl, youtubeVideoId } = parseYoutubeField(
      req.body.youtubeUrl,
    );
    service.youtubeUrl = youtubeUrl;
    service.youtubeVideoId = youtubeVideoId;
  }
  if (description !== undefined) service.description = description.trim();
  if (price !== undefined) service.price = price.trim();
  if (ideal !== undefined) service.ideal = ideal.trim();
  if (order !== undefined) service.order = Number(order) || 0;
  if (isActive !== undefined)
    service.isActive = isActive === "true" || isActive === true;
  if (req.body.includes !== undefined)
    service.includes = parseIncludes(req.body.includes);

  if (category) {
    const categoryDoc = await ServiceCategory.findById(category);
    if (!categoryDoc) throw new ApiError(400, "That category doesn't exist.");
    service.category = categoryDoc._id;
  }

  if (newSlugRaw !== undefined && slugify(newSlugRaw) !== service.slug) {
    const baseSlug = slugify(newSlugRaw) || slugify(service.title);
    service.slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
      if (candidate === service.slug) return false;
      return Boolean(
        await Service.findOne({ slug: candidate, _id: { $ne: service._id } }),
      );
    });
  }

  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload image.");
    if (service.image?.publicId)
      await deleteFromCloudinary(service.image.publicId);
    service.image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  await service.save();
  return res
    .status(200)
    .json(new ApiResponse(200, service, "Service updated successfully."));
});

// DELETE /api/v1/services/admin/:id  (admin)
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found.");

  if (service.image?.publicId)
    await deleteFromCloudinary(service.image.publicId);
  await service.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Service deleted successfully."));
});
