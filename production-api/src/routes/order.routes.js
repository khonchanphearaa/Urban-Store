import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { isUser } from "../middlewares/user.middleware.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
} from "../controllers/order.controller.js";

const router = express.Router();

/* All routes require login */
router.use(protect); 

// User routes
router.post("/",isUser, createOrder);
router.get("/", isUser, getUserOrders);
router.get("/:id", isUser, getOrderById);

// Admin route to update status
router.put("/:id", isAdmin, updateOrderStatus);
export default router;
