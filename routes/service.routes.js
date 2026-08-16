import express from "express";
import {
  getServices,
  getServiceBySlug,
  getAllServicesAdmin,
  getServiceByIdAdmin,
  createService,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/", getServices);
router.get("/slug/:slug", getServiceBySlug);

router.use("/admin", verifyJWT, authorizeRoles("admin"));
router.get("/admin/all", getAllServicesAdmin);
router.get("/admin/:id", getServiceByIdAdmin);
router.post("/admin", upload.single("image"), createService);
router.put("/admin/:id", upload.single("image"), updateService);
router.delete("/admin/:id", deleteService);

export default router;
