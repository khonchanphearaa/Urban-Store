import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { isUser } from "../middlewares/user.middleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem
} from "../controllers/cart.controller.js";

const router = express.Router();

// All cart routes are protected and for USER role only
router.use(protect, isUser); 

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update/:productId", updateCartItem);
router.delete("/remove/:productId", removeCartItem);

export default router;
