import express from "express";
import {
    getSettings,
    updateSettings,
    addPhone,
    updatePhone,
    deletePhone,
    addEmail,
    updateEmail,
    deleteEmail,
} from "../controllers/setting.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Public
router.get("/", getSettings);

// Admin - top level (companyName, address, map, socialLinks)
router.put("/admin", verifyJWT, authorizeRoles("admin"), updateSettings);

// Admin - phones
router.post("/admin/phones", verifyJWT, authorizeRoles("admin"), addPhone);
router.put("/admin/phones/:index", verifyJWT, authorizeRoles("admin"), updatePhone);
router.delete("/admin/phones/:index", verifyJWT, authorizeRoles("admin"), deletePhone);

// Admin - emails
router.post("/admin/emails", verifyJWT, authorizeRoles("admin"), addEmail);
router.put("/admin/emails/:index", verifyJWT, authorizeRoles("admin"), updateEmail);
router.delete("/admin/emails/:index", verifyJWT, authorizeRoles("admin"), deleteEmail);

export default router;