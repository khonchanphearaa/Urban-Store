import express from "express";
import { 
    createPayment, 
    confirmPayment 
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/bakong", createPayment);
router.post("/confirm", confirmPayment);

export default router;
