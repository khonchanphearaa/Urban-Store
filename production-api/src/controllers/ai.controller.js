import { runAgent } from "../services/ai.service.js";
import ChatHistory from "../models/ChatHistory.js";

/* Create a new chat message */
export const chat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body || {};

    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const reply = await runAgent(userId, message);

    res.json({ success: true, reply });
  } catch (err) {
    console.error("AI Agent error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* Get chat history for a user */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const record = await ChatHistory.findOne({ user: userId });

    res.json({
      success: true,
      history: record?.messages || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* Delete chat history for a user */
export const clearHistory = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ user: req.user._id });
    res.json({ success: true, message: "Chat history cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};