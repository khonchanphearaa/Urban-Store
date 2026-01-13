import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },

  refreshToken: { type: String }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
