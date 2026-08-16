import express from "express";
import { getAbout, updateAbout } from "../controllers/about.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/", getAbout);
router.put("/admin", verifyJWT, authorizeRoles("admin"), upload.single("image"), updateAbout);

export default router;
