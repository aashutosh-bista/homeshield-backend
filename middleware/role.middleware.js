import { ApiError } from "../utils/ApiError.js";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    const role = req.user?.role || req.venue?.role;

    if (!role || !allowedRoles.includes(role)) {
      throw new ApiError(403, "Access denied");
    }

    next();
  };
};