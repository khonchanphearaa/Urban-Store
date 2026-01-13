import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  method: String,
  status: String
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
