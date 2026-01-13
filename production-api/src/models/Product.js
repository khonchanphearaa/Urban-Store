import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [{ type: String }], // Store image URLs
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
