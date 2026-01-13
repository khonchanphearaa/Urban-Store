import express from "express";
import { register, login, logout, refreshToken } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { registerValidator } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.js";
import { registerLimiter, loginLimiter } from "../middlewares/authLimiter.js";

const router = express.Router();

router.post("/register", registerLimiter, registerValidator, validate, register);
router.post("/login", loginLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", protect, logout);

export default router;
    

