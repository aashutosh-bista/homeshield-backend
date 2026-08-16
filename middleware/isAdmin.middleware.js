// middleware/isAdmin.js

import { ApiError } from "../utils/ApiError.js";

export const isAdmin = (req, res, next) => {
  console.log(req.user)
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Admin access only");
  }

  next();
};