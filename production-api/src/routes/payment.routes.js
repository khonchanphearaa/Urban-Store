import express from "express";
import { 
    createPayment, 
    retryPayment
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/bakong", protect, createPayment);
router.post("/bakong/retry", protect, retryPayment);

export default router;
