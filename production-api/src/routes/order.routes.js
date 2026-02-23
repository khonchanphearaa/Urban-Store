import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { isUser } from "../middlewares/user.middleware.js";
import {
  createOrder,
  getUserOrders,
  getOrderById
} from "../controllers/order.controller.js";
import {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} from "../controllers/admin.order.controller.js";

const router = express.Router();

/* All routes require login */
router.use(protect); 

// User routes
router.post("/",isUser, createOrder);
router.get("/", isUser, getUserOrders);

// Admin routes
router.get("/admin", isAdmin, getAllOrders);
router.get("/admin/:id", isAdmin, getOrderByIdAdmin);
router.put("/admin/:id", isAdmin, updateOrderStatus);

// User route by id
router.get("/:id", isUser, getOrderById);
export default router;
