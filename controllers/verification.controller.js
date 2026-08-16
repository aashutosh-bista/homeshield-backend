import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  // hash the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  // find user with the hashed token and check if the token is not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    /*  emailVerificationTokenExpiry: {
     $gt: Date.now() // check if the token is not expired $gt means greater than
   } */
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }
  //if user is already verified then send response
  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email is already verified"));
  }
  //check expiry manually
  if (user.emailVerificationTokenExpiry < Date.now()) {
    //generate new token
    const {
      token: newToken,
      hashedToken: newHashedToken,
      expiryTime,
    } = generateToken();

    // save new token
    user.emailVerificationToken = newHashedToken;
    user.emailVerificationTokenExpiry = expiryTime;

    await user.save({ validateBeforeSave: false });

    // resend email
    const verificationURL = `${process.env.BASE_URL}/api/v1/users/verify-email/${newToken}`; 
    /* const verificationURL = `${process.env.CLIENT_URL}/verifyEmail/${newToken}`; */

    await sendEmail(
      user.email,
      "Verify your email",
      `<a href="${verificationURL}">
        Click here to verify your email
      </a>`,
    );

    throw new ApiError(
      400,
      "Verification link expired. New verification email sent.",
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully"));
});
