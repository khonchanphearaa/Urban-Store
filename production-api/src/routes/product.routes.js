import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addStock,
  toggleWishlist,
  getWishlist
} from "../controllers/product.controller.js";

import { upload } from "../middlewares/upload.js"; // multer + Cloudinary storage

const router = express.Router();

/*  Public Routes (USER With ADMIN) */
router.get("/", getProducts);
router.get("/wishlist", protect, getWishlist);
router.get("/:id", getProductById);

/* Authenticated User Routes */
router.post("/:id/wishlist", protect, toggleWishlist);

/* Admin Only Routes */
router.post("/", protect, isAdmin, upload.array("images", 5), createProduct);
router.put("/:id", protect, isAdmin, upload.array("images", 5), updateProduct);
router.post("/:id/add-stock", protect, isAdmin, addStock); 
router.delete("/:id", protect, isAdmin, deleteProduct);

export default router;
