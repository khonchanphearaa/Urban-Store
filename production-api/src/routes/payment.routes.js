import express from "express";
import { createPayment, retryPayment, checkPaymentStatus } from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/bakong", protect, createPayment);
router.post("/bakong/retry", protect, retryPayment);
router.post("/checkStatus", protect, checkPaymentStatus);

export default router;