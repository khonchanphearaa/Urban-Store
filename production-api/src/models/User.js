import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true, select: false },
  otp: {type: String},
  otpExpires: { type: Date },
  role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  refreshToken: { 
    type: String, 
    select: false   // Always hidden
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
