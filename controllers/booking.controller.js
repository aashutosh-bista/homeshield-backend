/* import { Booking } from "../models/booking.model.js";
import { Venue } from "../models/venue.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createBooking = asyncHandler(async (req, res) => {
  const { start, end, guestCount } = req.body;

  const venueId = req.params.venueId;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!venueId) {
    throw new ApiError(400, "Venue ID is required");
  }

  if (!start || !end) {
    throw new ApiError(400, "Start and end dates are required");
  }

  if (!guestCount) {
    throw new ApiError(400, "Guest count is required");
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  if (startDate > endDate) {
    throw new ApiError(400, "End date must be after start date");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    throw new ApiError(400, "Cannot book past dates");
  }

  const venue = await Venue.findById(venueId);

  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }

  // Check overlapping bookings
  const conflict = await Booking.findOne({
    venueId,
    status: "pending",
    start: { $lte: end },
    end: { $gte: start },
  });

  if (conflict) {
    throw new ApiError(409, "Venue already booked for selected dates");
  }

  if (guestCount > venue.capacity) {
    throw new ApiError(
      400,
      `Guest count exceeds venue capacity of ${venue.capacity}`,
    );
  }

  const booking = await Booking.create({
    userId,
    venueId,
    start,
    end,
    guestCount,
    commentBox,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, booking, "Booking created successfully"));
});

const getBookings = asyncHandler(async (req, res) => {
  const venueId = req.params.venueId;

  if (!venueId) {
    throw new ApiError(400, "Venue ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(venueId)) {
    throw new ApiError(400, "Invalid venue ID");
  }

  const bookings = await Booking.find({
    venueId,
  }).select("start end status");

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings retrieved successfully"));
});

const getAvailability = asyncHandler(async (req, res) => {
  const { venueId } = req.params;
  const { month } = req.query;

  if (!venueId) {
    throw new ApiError(400, "Venue ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(venueId)) {
    throw new ApiError(400, "Invalid venue ID");
  }

  if (!month) {
    throw new ApiError(400, "Month is required (YYYY-MM)");
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const monthStart = `${year}-${String(monthNumber).padStart(2, "0")}-01`;

  const lastDayNumber = new Date(year, monthNumber, 0).getDate();

  const monthEnd = `${year}-${String(monthNumber).padStart(2, "0")}-${String(lastDayNumber).padStart(2, "0")}`;

  const bookings = await Booking.find({
    venueId,
    status: "pending",
    start: { $lte: monthEnd },
    end: { $gte: monthStart },
  });

  const availability = {};

  for (let i = 1; i <= lastDayNumber; i++) {
    const dateKey = `${year}-${String(monthNumber).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

    availability[dateKey] = "available";
  }

  bookings.forEach((booking) => {
    let current = new Date(`${booking.start}T00:00:00`);

    const end = new Date(`${booking.end}T00:00:00`);

    while (current <= end) {
      const dateKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1,
      ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

      availability[dateKey] = "booked";

      current.setDate(current.getDate() + 1);
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, availability, "Availability fetched"));
});

const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const bookings = await Booking.find({
    userId,
  })
    .populate("venueId", "name location images pricePerDay capacity")
    .sort({
      createdAt: -1,
    });

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "My bookings fetched successfully"));
});

export { getMyBookings, createBooking, getBookings, getAvailability };
 */