import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: String,

    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [6, "Password must be at least 6 characters"],
    },

    role: {
      type: String,
      default: "admin",
    },

    refreshToken: String,

    emailVerificationToken: String,

    emailVerificationTokenExpiry: Date,

    passwordResetToken: String,

    passwordResetTokenExpiry: Date,
  },
  { timestamps: true },
);
// hasing password before saving to database using bcryptjs and mongoose pre save hook
//It says that when data is being saved to the database, the function will be executed before the actual save operation takes place. This allows you to perform certain actions, such as hashing the password, before the data is stored in the database.
//next flag is used to indicate that the middleware function has completed its task and the next middleware function in the stack can be executed. It is a callback function that is typically called at the end of the middleware function to signal that it has finished processing and that the next middleware function can be invoked.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // check if it is modified or not if not then return next() and if it is modified then hash the password and save to database
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}; //return ture or false if password is correct or not

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
  );
};

export const User = mongoose.model("User", userSchema);
