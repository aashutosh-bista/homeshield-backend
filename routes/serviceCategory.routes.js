import express from "express";
import {
  getServiceCategories,
  getServiceCategoryBySlug,
  getAllServiceCategoriesAdmin,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from "../controllers/serviceCategory.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/", getServiceCategories);
router.get("/slug/:slug", getServiceCategoryBySlug);

router.use("/admin", verifyJWT, authorizeRoles("admin"));
router.get("/admin/all", getAllServiceCategoriesAdmin);
router.post("/admin", upload.single("image"), createServiceCategory);
router.put("/admin/:id", upload.single("image"), updateServiceCategory);
router.delete("/admin/:id", deleteServiceCategory);

export default router;
