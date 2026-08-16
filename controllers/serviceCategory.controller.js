import { ServiceCategory } from "../models/serviceCategory.model.js";
import { Service } from "../models/service.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { slugify, ensureUniqueSlug } from "../utils/slugify.js";
import fs from "fs";

const cleanupTempFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlink(file.path, () => {});
};

// GET /api/v1/service-categories  (public)
export const getServiceCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, categories, "Service categories fetched successfully."));
});

// GET /api/v1/service-categories/slug/:slug  (public) — category + its services
export const getServiceCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw new ApiError(404, "Service category not found.");

  const services = await Service.find({ category: category._id, isActive: true }).sort({ order: 1, createdAt: 1 });

  return res.status(200).json(new ApiResponse(200, { category, services }, "Service category fetched successfully."));
});

// GET /api/v1/service-categories/admin/all  (admin)
export const getAllServiceCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find().sort({ order: 1, createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, categories, "Service categories fetched successfully."));
});

// POST /api/v1/service-categories/admin  (admin, multipart)
export const createServiceCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, order, isActive } = req.body;

  if (!name?.trim()) {
    cleanupTempFile(req.file);
    throw new ApiError(400, "Name is required.");
  }

  const baseSlug = slugify(req.body.slug?.trim() || name);
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) =>
    Boolean(await ServiceCategory.findOne({ slug: candidate }))
  );

  let image = { url: "", publicId: "" };
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload image.");
    image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  const category = await ServiceCategory.create({
    name: name.trim(),
    slug,
    description: description?.trim() || "",
    icon: icon?.trim() || "Wrench",
    image,
    order: Number(order) || 0,
    isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
  });

  return res.status(201).json(new ApiResponse(201, category, "Service category created successfully."));
});

// PUT /api/v1/service-categories/admin/:id  (admin, multipart)
export const updateServiceCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) {
    cleanupTempFile(req.file);
    throw new ApiError(404, "Service category not found.");
  }

  const { name, description, icon, order, isActive, slug: newSlugRaw } = req.body;

  if (name !== undefined) category.name = name.trim();
  if (description !== undefined) category.description = description.trim();
  if (icon !== undefined) category.icon = icon.trim();
  if (order !== undefined) category.order = Number(order) || 0;
  if (isActive !== undefined) category.isActive = isActive === "true" || isActive === true;

  if (newSlugRaw !== undefined && slugify(newSlugRaw) !== category.slug) {
    const baseSlug = slugify(newSlugRaw) || slugify(category.name);
    category.slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
      if (candidate === category.slug) return false;
      return Boolean(await ServiceCategory.findOne({ slug: candidate, _id: { $ne: category._id } }));
    });
  }

  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload image.");
    if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
    category.image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  await category.save();
  return res.status(200).json(new ApiResponse(200, category, "Service category updated successfully."));
});

// DELETE /api/v1/service-categories/admin/:id  (admin)
export const deleteServiceCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Service category not found.");

  const servicesUnderCategory = await Service.countDocuments({ category: category._id });
  if (servicesUnderCategory > 0) {
    throw new ApiError(400, `Can't delete: ${servicesUnderCategory} service(s) still belong to this category. Delete or reassign them first.`);
  }

  if (category.image?.publicId) await deleteFromCloudinary(category.image.publicId);
  await category.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Service category deleted successfully."));
});
