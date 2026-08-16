import express from "express";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  deleteBlogImage,
  getPublishedBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogByIdAdmin,
} from "../controllers/blog.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

const blogUpload = upload.fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// ---- Public ----
router.get("/", getPublishedBlogs);
router.get("/slug/:slug", getBlogBySlug);

// ---- Admin ----
router.use("/admin", verifyJWT, authorizeRoles("admin"));

router.get("/admin/all", getAllBlogsAdmin);
router.get("/admin/:id", getBlogByIdAdmin);
router.post("/admin", blogUpload, createBlog);
router.put("/admin/:id", blogUpload, updateBlog);
router.delete("/admin/:id", deleteBlog);
router.delete("/admin/:id/images/:imageId", deleteBlogImage);

export default router;
