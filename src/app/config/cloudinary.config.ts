import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { envVars } from "./env.js";

// Cloudinary configuration
cloudinary.config({
  cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export type CloudinaryFolder = "gym/profiles" | "gym/documents";

/**
 * Upload buffer file to Cloudinary
 * Works with multer memoryStorage
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: CloudinaryFolder = "gym/profiles",
  publicId?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [
          {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",
          },
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(
            new Error("Cloudinary upload returned empty result")
          );
        }

        resolve(result);
      }
    );

    // Convert buffer into stream and upload
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Extract public_id from Cloudinary URL
 *
 * Example:
 * https://res.cloudinary.com/demo/image/upload/v123/gym/profiles/test.jpg
 *
 * Returns:
 * gym/profiles/test
 */
export const extractPublicId = (url: string): string => {
  const afterUpload = url.split("/upload/")[1];

  if (!afterUpload) {
    return "";
  }

  // Remove version part like v123456/
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");

  // Remove file extension
  return withoutVersion.replace(/\.[^/.]+$/, "");
};