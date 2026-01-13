import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // 👤 User who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🛒 Order items
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,      // KHR
        quantity: Number,
      },
    ],

    // 💰 Totals (KHR)
    totalPrice: {
      type: Number,
      required: true,      // integer (KHR)
    },

    totalQuantity: {
      type: Number,
      required: true,
    },

    // 📦 Delivery info
    deliveryAddress: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    // 💳 Payment method
    paymentMethod: {
      type: String,
      enum: ["BAKONG_KHQR"],
      default: "BAKONG_KHQR",
    },

    // 💳 Payment details (Bakong)
    payment: {
      method: {
        type: String,
        default: "BAKONG_KHQR",
      },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
      currency: {
        type: String,
        default: "KHR",
      },
      amount: {
        type: Number, // same as totalPrice
      },
      qrString: {
        type: String, // KHQR string
      },
      hash:{
        type: String, /* md5 */
      },
      txHash: {
        type: String, // Bakong transaction hash (later)
      },
    },

    // 📌 Order status
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },

    // ✅ Payment flag
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
