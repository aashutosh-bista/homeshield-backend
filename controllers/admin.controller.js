/* // controllers/admin.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Venue } from "../models/venue.model.js";
import { User } from "../models/user.model.js";
import { getPagination } from "../utils/pagination.js";
import { generateVenueId } from "../utils/generateVenueId.js";
import { generateTemporaryPassword } from "../utils/generateVenuePassword.js";

import { sendEmail } from "../utils/sendEmail.js";

export const changeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "approved", "suspended", "blocked"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const venue = await Venue.findById(id);

  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }

  // Only run approval setup once
  if (status === "approved" && !venue.isAdminVerified) {
    if (!venue.isEmailVerified) {
      throw new ApiError(400, "Venue email not verified");
    }

    const owner = await User.findById(venue.ownerId);

    if (!owner) {
      throw new ApiError(404, "Owner not found");
    }

    let venueId;
    let exists = true;

    while (exists) {
      venueId = generateVenueId(venue.name);
      exists = await Venue.findOne({ venueId });
    }

    const tempPassword = generateTemporaryPassword();

    owner.role = "owner";
    await owner.save();

    venue.venueId = venueId;
    venue.password = tempPassword;
    venue.isAdminVerified = true;
    venue.isFirstLogin = true;

    await sendEmail(
      venue.email,
      "Venue Approved",
      `
    <h2>Congratulations!</h2>
    <p>Your venue has been approved.</p>

    <p><strong>Venue ID:</strong> ${venueId}</p>
    <p><strong>Password:</strong> ${tempPassword}</p>

    <p>Please login and change your password.</p>
  `,
    );
  }

  venue.status = status;

  await venue.save();

  return res
    .status(200)
    .json(new ApiResponse(200, venue, "Venue status updated successfully"));
});

export const getAllVenuesAdmin = asyncHandler(async (req, res) => {
  const { limitNum, skip } = getPagination(req.query);

  const venues = await Venue.find({})
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 })
    .select("-password -refreshToken -accessToken");

  return res
    .status(200)
    .json(new ApiResponse(200, venues, "All venues retrieved successfully"));
});
 */