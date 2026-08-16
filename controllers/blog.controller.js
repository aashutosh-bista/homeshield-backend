import { Blog } from "../models/blog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getPagination } from "../utils/pagination.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { slugify, ensureUniqueSlug } from "../utils/slugify.js";
import { extractYoutubeId } from "../utils/youtube.js";
import fs from "fs";

// Parses the `youtubeVideos` form field, which the frontend sends as a JSON
// string like: [{ "url": "https://youtube.com/watch?v=...", "title": "..." }]
const parseYoutubeVideos = (raw) => {
  if (!raw) return [];

  let list;
  try {
    list = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new ApiError(400, "youtubeVideos must be valid JSON.");
  }

  if (!Array.isArray(list)) {
    throw new ApiError(400, "youtubeVideos must be an array.");
  }

  return list.map((item) => {
    const url = (item.url || "").trim();
    const videoId = extractYoutubeId(url);

    if (!videoId) {
      throw new ApiError(400, `"${url}" is not a valid YouTube link.`);
    }

    return { url, videoId, title: (item.title || "").trim() };
  });
};

// Cleans up any temp files multer wrote to disk if we bail out before
// uploadOnCloudinary (which normally deletes the temp file itself).
const cleanupTempFiles = (files = []) => {
  for (const file of files) {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, () => {});
    }
  }
};

// POST /api/v1/blogs/admin  (admin, multipart/form-data)
export const createBlog = asyncHandler(async (req, res) => {
  const { title, excerpt, body, category, author, status } = req.body;

  if (!title?.trim() || !excerpt?.trim() || !body?.trim()) {
    cleanupTempFiles([...(req.files?.featuredImage || []), ...(req.files?.images || [])]);
    throw new ApiError(400, "Title, excerpt, and body are required.");
  }

  const youtubeVideos = parseYoutubeVideos(req.body.youtubeVideos);

  const baseSlug = slugify(req.body.slug?.trim() || title);
  if (!baseSlug) {
    throw new ApiError(400, "Could not generate a slug from the title.");
  }
  const slug = await ensureUniqueSlug(baseSlug, async (candidate) =>
    Boolean(await Blog.findOne({ slug: candidate }))
  );

  // Featured image (single)
  let featuredImage = null;
  const featuredFile = req.files?.featuredImage?.[0];
  if (featuredFile) {
    const uploaded = await uploadOnCloudinary(featuredFile.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload featured image.");
    featuredImage = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  // Gallery images (multiple, for the slider)
  const galleryFiles = req.files?.images || [];
  const images = [];
  for (const file of galleryFiles) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload one of the gallery images.");
    images.push({ url: uploaded.secure_url, publicId: uploaded.public_id, caption: "" });
  }

  const blog = await Blog.create({
    title: title.trim(),
    slug,
    excerpt: excerpt.trim(),
    body,
    category: category?.trim() || "",
    author: author?.trim() || "HomeShield Consulting",
    status: status === "published" ? "published" : "draft",
    featuredImage,
    images,
    youtubeVideos,
    createdBy: req.user?._id,
  });

  return res.status(201).json(new ApiResponse(201, blog, "Blog post created successfully."));
});

// PUT /api/v1/blogs/admin/:id  (admin, multipart/form-data)
export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) {
    cleanupTempFiles([...(req.files?.featuredImage || []), ...(req.files?.images || [])]);
    throw new ApiError(404, "Blog post not found.");
  }

  const { title, excerpt, body, category, author, status, slug: newSlugRaw, removeFeaturedImage } = req.body;

  if (title !== undefined) blog.title = title.trim();
  if (excerpt !== undefined) blog.excerpt = excerpt.trim();
  if (body !== undefined) blog.body = body;
  if (category !== undefined) blog.category = category.trim();
  if (author !== undefined) blog.author = author.trim();
  if (status !== undefined) blog.status = status === "published" ? "published" : "draft";

  if (newSlugRaw !== undefined && slugify(newSlugRaw) !== blog.slug) {
    const baseSlug = slugify(newSlugRaw) || slugify(blog.title);
    blog.slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
      if (candidate === blog.slug) return false;
      const existing = await Blog.findOne({ slug: candidate, _id: { $ne: blog._id } });
      return Boolean(existing);
    });
  }

  if (req.body.youtubeVideos !== undefined) {
    blog.youtubeVideos = parseYoutubeVideos(req.body.youtubeVideos);
  }

  // Replace featured image if a new one was uploaded
  const featuredFile = req.files?.featuredImage?.[0];
  if (featuredFile) {
    const uploaded = await uploadOnCloudinary(featuredFile.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload featured image.");
    if (blog.featuredImage?.publicId) {
      await deleteFromCloudinary(blog.featuredImage.publicId);
    }
    blog.featuredImage = { url: uploaded.secure_url, publicId: uploaded.public_id };
  } else if (removeFeaturedImage === "true" && blog.featuredImage?.publicId) {
    await deleteFromCloudinary(blog.featuredImage.publicId);
    blog.featuredImage = null;
  }

  // Append any newly uploaded gallery images (existing ones are untouched;
  // remove individual images via DELETE /admin/:id/images/:imageId)
  const galleryFiles = req.files?.images || [];
  for (const file of galleryFiles) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (!uploaded) throw new ApiError(500, "Failed to upload one of the gallery images.");
    blog.images.push({ url: uploaded.secure_url, publicId: uploaded.public_id, caption: "" });
  }

  await blog.save();

  return res.status(200).json(new ApiResponse(200, blog, "Blog post updated successfully."));
});

// DELETE /api/v1/blogs/admin/:id  (admin)
export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog post not found.");
  }

  const deletions = [];
  if (blog.featuredImage?.publicId) deletions.push(deleteFromCloudinary(blog.featuredImage.publicId));
  for (const img of blog.images) {
    if (img.publicId) deletions.push(deleteFromCloudinary(img.publicId));
  }
  await Promise.allSettled(deletions);

  await blog.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Blog post deleted successfully."));
});

// DELETE /api/v1/blogs/admin/:id/images/:imageId  (admin) — remove one gallery image
export const deleteBlogImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog post not found.");
  }

  const image = blog.images.id(imageId);
  if (!image) {
    throw new ApiError(404, "Image not found on this post.");
  }

  if (image.publicId) {
    await deleteFromCloudinary(image.publicId);
  }
  blog.images.pull(imageId);
  await blog.save();

  return res.status(200).json(new ApiResponse(200, blog, "Image removed successfully."));
});

// GET /api/v1/blogs?search=&category=&page=&limit=  (public — published only)
export const getPublishedBlogs = asyncHandler(async (req, res) => {
  const { search = "", category = "" } = req.query;
  const { pageNum, limitNum, skip } = getPagination(req.query);

  const filter = { status: "published" };
  if (category.trim()) filter.category = category.trim();
  if (search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { excerpt: { $regex: search.trim(), $options: "i" } },
      { category: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Blog.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { blogs, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      "Blog posts fetched successfully."
    )
  );
});

// GET /api/v1/blogs/slug/:slug  (public — published only)
export const getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const blog = await Blog.findOne({ slug, status: "published" });

  if (!blog) {
    throw new ApiError(404, "Blog post not found.");
  }

  return res.status(200).json(new ApiResponse(200, blog, "Blog post fetched successfully."));
});

// GET /api/v1/blogs/admin/all?status=&page=&limit=  (admin — all statuses)
export const getAllBlogsAdmin = asyncHandler(async (req, res) => {
  const { status = "" } = req.query;
  const { pageNum, limitNum, skip } = getPagination(req.query);

  const filter = {};
  if (status === "draft" || status === "published") filter.status = status;

  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Blog.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { blogs, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      "Blog posts fetched successfully."
    )
  );
});

// GET /api/v1/blogs/admin/:id  (admin — any status, used to prefill the editor)
export const getBlogByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog post not found.");
  }

  return res.status(200).json(new ApiResponse(200, blog, "Blog post fetched successfully."));
});
