import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: Number,
    method: String,
    status: String,
    hash: String,
    md5: String, 
    txHash: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
