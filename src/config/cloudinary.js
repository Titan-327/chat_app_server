import { v2 as cloudinary } from "cloudinary";

// DEBUG: Check if keys are loaded
// (Don't worry, this runs on the server, users won't see it)
if (!process.env.CLOUDINARY_API_KEY) {
  console.error("❌ CLOUDINARY ERROR: API Key is missing!");
  console.error("Current env variables:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING",
  });
} else {
  console.log("✅ Cloudinary Configured for:", process.env.CLOUDINARY_CLOUD_NAME);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;