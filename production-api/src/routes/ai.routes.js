import { Router } from "express";
import { chat, getChatHistory, clearHistory } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/chat", protect, chat);
router.get("/chat/history", protect, getChatHistory);
router.delete("/chat/history", protect, clearHistory);

export default router;