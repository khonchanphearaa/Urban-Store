import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify config loaded (optional - remove in production)
console.log('Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' : undefined,
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : undefined
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/products",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }]
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default cloudinary;