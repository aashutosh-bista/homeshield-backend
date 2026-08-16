import express from "express";
import {
  getServiceAreas,
  getAllServiceAreasAdmin,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from "../controllers/serviceArea.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", getServiceAreas);

router.use("/admin", verifyJWT, authorizeRoles("admin"));
router.get("/admin/all", getAllServiceAreasAdmin);
router.post("/admin", createServiceArea);
router.put("/admin/:id", updateServiceArea);
router.delete("/admin/:id", deleteServiceArea);

export default router;
