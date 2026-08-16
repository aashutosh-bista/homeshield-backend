import { Faq } from "../models/faq.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/v1/faqs  (public — active only)
export const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully."));
});

// GET /api/v1/faqs/admin/all  (admin — all)
export const getAllFaqsAdmin = asyncHandler(async (req, res) => {
  const faqs = await Faq.find().sort({ order: 1, createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully."));
});

// POST /api/v1/faqs/admin  (admin)
export const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, order, isActive } = req.body;
  if (!question?.trim() || !answer?.trim()) {
    throw new ApiError(400, "Question and answer are required.");
  }

  const faq = await Faq.create({
    question: question.trim(),
    answer: answer.trim(),
    order: Number(order) || 0,
    isActive: isActive === undefined ? true : Boolean(isActive),
  });

  return res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully."));
});

// PUT /api/v1/faqs/admin/:id  (admin)
export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");

  const { question, answer, order, isActive } = req.body;
  if (question !== undefined) faq.question = question.trim();
  if (answer !== undefined) faq.answer = answer.trim();
  if (order !== undefined) faq.order = Number(order) || 0;
  if (isActive !== undefined) faq.isActive = Boolean(isActive);

  await faq.save();
  return res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully."));
});

// DELETE /api/v1/faqs/admin/:id  (admin)
export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");

  await faq.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "FAQ deleted successfully."));
});
