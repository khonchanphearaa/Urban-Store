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
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }
  ],
  avatar:{
    url: {
      type: String,
      default: "https://res.cloudinary.com/demo/image/upload/d_avatar.png/v1/user_default.png"
    },
    public_id: { type: String, default: null }
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
