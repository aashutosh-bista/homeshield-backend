import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config";

// fs is file system module, used to read files from the local file system

//This configuration is required to connect to the Cloudinary service using the credentials stored in environment variables and it is used for giving permissions.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    //if there is no local path on cloudinary

    if (!localFilePath) {
      return null;
    }
    //error from here
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // T
      // this will automatically detect the file type (image, video, etc.)
    });

    //delete temp file after upload success
    await fs.promises.unlink(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Delete the local file in case of any error

    console.error("Unexpected error:", error);

    return null;
  }
};
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  return await cloudinary.uploader.destroy(publicId);
};

export { uploadOnCloudinary, deleteFromCloudinary };
