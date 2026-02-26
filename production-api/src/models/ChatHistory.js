import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"] },
  text: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("ChatHistory", chatHistorySchema);