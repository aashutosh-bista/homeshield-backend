import express from "express";
import { getFaqs, getAllFaqsAdmin, createFaq, updateFaq, deleteFaq } from "../controllers/faq.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", getFaqs);

router.use("/admin", verifyJWT, authorizeRoles("admin"));
router.get("/admin/all", getAllFaqsAdmin);
router.post("/admin", createFaq);
router.put("/admin/:id", updateFaq);
router.delete("/admin/:id", deleteFaq);

export default router;
