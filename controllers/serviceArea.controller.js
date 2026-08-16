import { ServiceArea } from "../models/serviceArea.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/v1/service-areas  (public — active only)
export const getServiceAreas = asyncHandler(async (req, res) => {
  const areas = await ServiceArea.find({ isActive: true }).sort({ order: 1, name: 1 });
  return res.status(200).json(new ApiResponse(200, areas, "Service areas fetched successfully."));
});

// GET /api/v1/service-areas/admin/all  (admin — all)
export const getAllServiceAreasAdmin = asyncHandler(async (req, res) => {
  const areas = await ServiceArea.find().sort({ order: 1, name: 1 });
  return res.status(200).json(new ApiResponse(200, areas, "Service areas fetched successfully."));
});

// POST /api/v1/service-areas/admin  (admin)
export const createServiceArea = asyncHandler(async (req, res) => {
  const { name, description, order, isActive } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Name is required.");

  const area = await ServiceArea.create({
    name: name.trim(),
    description: description?.trim() || "",
    order: Number(order) || 0,
    isActive: isActive === undefined ? true : Boolean(isActive),
  });

  return res.status(201).json(new ApiResponse(201, area, "Service area created successfully."));
});

// PUT /api/v1/service-areas/admin/:id  (admin)
export const updateServiceArea = asyncHandler(async (req, res) => {
  const area = await ServiceArea.findById(req.params.id);
  if (!area) throw new ApiError(404, "Service area not found.");

  const { name, description, order, isActive } = req.body;
  if (name !== undefined) area.name = name.trim();
  if (description !== undefined) area.description = description.trim();
  if (order !== undefined) area.order = Number(order) || 0;
  if (isActive !== undefined) area.isActive = Boolean(isActive);

  await area.save();
  return res.status(200).json(new ApiResponse(200, area, "Service area updated successfully."));
});

// DELETE /api/v1/service-areas/admin/:id  (admin)
export const deleteServiceArea = asyncHandler(async (req, res) => {
  const area = await ServiceArea.findById(req.params.id);
  if (!area) throw new ApiError(404, "Service area not found.");

  await area.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Service area deleted successfully."));
});
