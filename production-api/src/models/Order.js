import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    totalPrice: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },

    discount: {
      type: {
        type: String,
        enum: ["NONE", "FIXED", "PERCENT"],
        default: "NONE",
      },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },

    finalAmount: { type: Number, required: true },

    deliveryAddress: { 
      type: String,
      required: false },
    phoneNumber: { 
      type: String, 
      required: false },

    paymentMethod: {
      type: String,
      enum: ["BAKONG_KHQR"],
      default: "BAKONG_KHQR",
    },

    payment: {
      method: String,
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
      currency: { type: String, default: "KHR" },
      amount: Number,
      qrString: String,
      hash: String,
      txHash: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },

    isPaid: { type: Boolean, default: false },

    /* TelegramNofi */
    telegramNotify:{
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
