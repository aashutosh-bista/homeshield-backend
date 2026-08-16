/* import { Router } from "express";
import {createBooking,getBookings,getAvailability,getMyBookings} from "../controllers/booking.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
// Public routes
router.route("/:venueId").post(verifyJWT, createBooking);
router.route("/venue/:venueId").get( getBookings);
router.route("/venue/:venueId/availability").get(getAvailability);
router.get(
  "/my-bookings",
  verifyJWT,
  getMyBookings
);
export default router;
 */