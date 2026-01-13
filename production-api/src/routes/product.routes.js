import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { upload } from "../middlewares/upload.js"; // multer + Cloudinary storage

const router = express.Router();

/*  Public Routes (USER + ADMIN) */
router.get("/", getProducts);
router.get("/:id", getProductById);

/* Admin Only Routes */
// Upload multiple images (max 5) directly to Cloudinary
router.post("/", protect, isAdmin, upload.array("images", 5), createProduct);
router.put("/:id", protect, isAdmin, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, isAdmin, deleteProduct);

export default router;
