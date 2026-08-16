import cron from "node-cron";
import {User} from "../models/user.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

cron.schedule("0 * * * *", async () => {
  try {
    const users = await User.find({
      isDeleted: true,
      deleteAt: { $lte: new Date() },
    });

    for (const user of users) {

      if (!user) {
        throw new ApiError(404, "User not found in cron job");
      }

      // delete image from Cloudinary
      if (user.profileImage?.publicId) {
        try {
          await deleteFromCloudinary(user.profileImage.publicId);
        } catch (err) {
          console.log("Cloudinary delete failed:", err.message);
        }
      }

      // delete user from DB
      await User.findByIdAndDelete(user._id);
    }

  } catch (error) {
    console.log("Cron error:", error);

    throw new ApiError(500, "Cron job failed while deleting users");
  }
});