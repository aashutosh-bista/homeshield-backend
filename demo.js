import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Venue } from "../models/venue.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getPagination } from "../utils/pagination.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import crypto from 'crypto';
import { generateToken } from "../utils/tokenGenerator.js";
import { sendEmail } from "../utils/sendEmail.js";

const generateAccessAndRefreshTokens = async (venueId) => {
  try {
    const venue = await Venue.findById(venueId);
    const accessToken = venue.generateAccessToken();
    const refreshToken = venue.generateRefreshToken();

    //added to venue document in database
    venue.refreshToken = refreshToken;

    //save to database
    const result = await venue.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message || "Token generation failed");
  }
};

const registerVenue = asyncHandler(async (req, res) => {
  // Logged in user becomes venue owner
  const ownerId = req.user?._id;

  if (!ownerId) {
    throw new ApiError(401, "Unauthorized: Owner ID is required");
  }

  const {
    venueId,
    name,
    address,
    email,
    phone,
    registrationNumber,
    panNumber,
    password,
  } = req.body;

  // Validate required fields
  const requiredFields = [
    venueId,
    name,
    address,
    email,
    phone,
    registrationNumber,
    panNumber,
    password,
  ];

  if (requiredFields.some((field) => !String(field).trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Check if venue already exists
  const existedVenue = await Venue.findOne({
    $or: [
      { email },
      { registrationNumber },
      { panNumber },
      { venueId },
    ],
  });

  if (existedVenue) {
    throw new ApiError(
      409,
      "Venue with this email, registration number, PAN, or venue ID already exists"
    );
  }

  // Check if logged-in user's email matches venue email
  const isSameEmail =
    req.user.email.toLowerCase() === email.toLowerCase();

  let token;
  let hashedToken;
  let expiryTime;

  // Generate token only if verification is needed
  if (!isSameEmail) {
    const generatedToken = generateToken();

    token = generatedToken.token;
    hashedToken = generatedToken.hashedToken;
    expiryTime = generatedToken.expiryTime;
  }

  // Create venue
  const venue = await Venue.create({
    venueId,
    name,
    address,
    email,
    phone,
    registrationNumber,
    panNumber,
    password,
    ownerId,

    // Auto verify if same email as logged-in user
    isEmailVerified: isSameEmail ? true : false,

    emailVerificationToken: isSameEmail
      ? undefined
      : hashedToken,

    emailVerificationTokenExpiry: isSameEmail
      ? undefined
      : expiryTime,

    // Optional business status
    status: "Pending",
  });

  const createdVenue = await Venue.findById(venue._id).select(
    "-password -refreshToken"
  );

  if (!createdVenue) {
    throw new ApiError(500, "Venue creation failed");
  }

  // Send verification email only if needed
  if (!isSameEmail) {
    const verificationURL = `${process.env.BASE_URL}/api/v1/venues/verify-email/${token}`;

    const sendEmailResult = await sendEmail(
      venue.email,
      "Verify your venue email",
      `
        <h2>Verify Your Venue Email</h2>
        <p>Please click the link below to verify your venue email:</p>
        <a href="${verificationURL}">
          Verify Venue
        </a>
      `
    );

    // Rollback if email sending fails
    if (!sendEmailResult) {
      await Venue.findByIdAndDelete(venue._id);

      throw new ApiError(
        500,
        "Failed to send verification email. Please register again."
      );
    }
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      createdVenue,
      isSameEmail
        ? "Venue registered successfully."
        : "Venue registered successfully. Verification email sent."
    )
  );
});

const loginVenue = asyncHandler(async (req, res) => {
  const { venueId, password } = req.body;
  if (!venueId || !password) {
    throw new ApiError(400, "Venue ID and password are required");
  }
  const venue = await Venue.findOne({ venueId });

  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }

  if (!venue.isVerified) {
    throw new ApiError(403, "Venue is not verified");
  }
  const isPasswordMatched = await venue.isPasswordCorrect(password);

  if (!isPasswordMatched) {
    throw new ApiError(402, "Invalid password");
  }
  //generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    venue._id,
  );

  const loggedInVenue = await Venue.findById(venue._id).select(
    "-password -refreshToken",
  );
  if (!loggedInVenue) {
    throw new ApiError(500, "Venue login failed");
  }
  //send response with access token and refresh token in cookies
  const options = {
    httpOnly: true, // to prevent client side scripts from accessing the cookie
    secure: true, // to ensure the cookie is only sent over HTTPS
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        //below is data that we want to send in response when venue login successfully
        { venue: loggedInVenue, accessToken, refreshToken },
        "Login successful",
      ),
    );
});

const logoutVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.venue._id);
  await Venue.findByIdAndUpdate(
    req.venue._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "logged out successfully"));
});
const editVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.venue._id);

  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }

  const { name, address, phone, pricePerDay,capacity,description } = req.body;

  if (name) venue.name = name;
  if (address) venue.address = address;
  if (phone) venue.phone = phone;
  if (pricePerDay) venue.pricePerDay = pricePerDay;
  if(capacity) venue.capacity = capacity;
  if(description) venue.description = description;

  // prevent email update
  if (req.body.email) {
    throw new ApiError(400, "Email cannot be changed from this endpoint");
  }

  // handle images if uploaded
  if (req.files && req.files.length > 0) {
    const imagePaths = req.files.map((file) => file.path);

    // delete old images if exist
    if (venue.images?.length > 0) {
      for (const image of venue.images) {
        await deleteFromCloudinary(image.publicId);
      }
    }

    // upload new images
    const uploadedImages = [];

    for (const path of imagePaths) {
      const result = await uploadOnCloudinary(path);

      if (!result) {
        throw new ApiError(400, "Image upload failed");
      }

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    venue.images = uploadedImages;
  }

  const updatedVenue = await venue.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVenue, "Venue updated successfully"));
});

const changeVenuePassword = asyncHandler(async (req, res) => {
  const venueId = req.venue._id;

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const venue = await Venue.findById(venueId);

  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }

  // check old password
  const isMatch = await venue.isPasswordCorrect(oldPassword);

  if (!isMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  // set new password (will be hashed automatically if schema has pre-save hook)
  venue.password = newPassword;

  await venue.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});
//delete venue
const requestDeleteVenue = asyncHandler(async (req, res) => {
  const venueId = req.venue._id;
  const { password } = req.body;

  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }
  // 🔐 optional security check
  const isMatch = await venue.isPasswordCorrect(password);

  if (!isMatch) {
    throw new ApiError(401, "Incorrect password");
  }
  const deleteAfterDays = 7;
  venue.isDeleted = true;
  venue.deleteAt = new Date(Date.now() + deleteAfterDays * 24 * 60 * 60 * 1000);

  await venue.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Account scheduled for deletion in 7 days"),
    );
});
//cancel deletion
const recoverAccount = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const venue = await Venue.findOne({ email });

  if (!venue) {
    throw new ApiError(404, "venue not found");
  }

  const isPasswordValid = await venue.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (venue.isDeleted) {
    venue.isDeleted = false;
    venue.deleteAt = null;
    await venue.save();
  }

  return res.status(200).json({
    success: true,
    message: "Account restored successfully",
  });
});
//get venues details
const getVenueDetails = asyncHandler(async (req, res) => {
  const venueId = req.params.id;
  const venue = await Venue.findById(venueId).select("-password -refreshToken");
  if (!venue) {
    throw new ApiError(404, "Venue not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, venue, "Venue details retrieved successfully"));
});
//get all venues for the public user
const getAllVenues = asyncHandler(async (req, res) => {
  const { pageNum, limitNum, skip } = getPagination(req.query);

  const venues = await Venue.find({
    isDeleted: false,
    isVerified: true,

    // Ensure required fields are filled
    name: { $exists: true, $ne: "" },
    address: { $exists: true, $ne: "" },
    /* description: { $exists: true, $ne: "" }, */
   /*  images: { $exists: true, $ne: [] },
    pricePerDay: { $exists: true, $ne: null },*/
    capacity: { $exists: true, $ne: null }, 
  })
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 })
    .select(
      "-isDeleted -deletedAt -isVerified -createdAt -updatedAt -role -status -refreshToken -accessToken -password -panNumber -registrationNumber -email -phoneNumber"
    );

  if (!venues || venues.length === 0) {
    throw new ApiError(404, "No venues found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, venues, "Venues retrieved successfully"));
});

const verifyVenueEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Hash token
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find venue
  const venue = await Venue.findOne({
    emailVerificationToken: hashedToken,
  });

  if (!venue) {
    throw new ApiError(400, "Invalid verification token");
  }

  // Already verified
  if (venue.isEmailVerified) {
    return res.status(200).json(
      new ApiResponse(200, {}, "Venue email already verified")
    );
  }

  // Expired token
  if (venue.emailVerificationTokenExpiry < Date.now()) {
    // Generate new token
    const {
      token: newToken,
      hashedToken: newHashedToken,
      expiryTime,
    } = generateToken();

    // Save new token
    venue.emailVerificationToken = newHashedToken;
    venue.emailVerificationTokenExpiry = expiryTime;

    await venue.save({ validateBeforeSave: false });

    // Send new verification email
    const verificationURL = `${process.env.BASE_URL}/api/v1/venues/verify-email/${newToken}`;

    await sendEmail(
      venue.email,
      "Verify your venue email",
      `
        <h2>Verify Venue Email</h2>
        <a href="${verificationURL}">
          Click here to verify your venue
        </a>
      `
    );

    throw new ApiError(
      400,
      "Verification link expired. New verification email sent."
    );
  }

  // Verify venue
  venue.isEmailVerified = true;
  venue.emailVerificationToken = undefined;
  venue.emailVerificationTokenExpiry = undefined;

  await venue.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Venue email verified successfully"
    )
  );
});

export {
  registerVenue,
  loginVenue,
  logoutVenue,
  editVenue,
  changeVenuePassword,
  verifyVenueEmail,
  requestDeleteVenue,
  recoverAccount,
  getVenueDetails,
  getAllVenues,
};
