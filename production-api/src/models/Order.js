import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    /* USER */
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
        },
        name: String,
        price: Number,   // KHR
        quantity: Number,
      },
    ],

    totalPrice: {
      type: Number,
      required: true, 
    },

    totalQuantity: {
      type: Number,
      required: true,
    },

    discount: {
      type: {
        type: String,
        enum: ["NONE", "FIXED", "PERCENT"],
        default: "NONE",
      },
      value: {
        type: Number, 
        default: 0,
      },
      amount: {
        type: Number, 
        default: 0,
      },
    },

    /*  FINAL PAYABLE AMOUNT  */
    finalAmount: {
      type: Number,
      required: true, 
    },

    deliveryAddress: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["BAKONG_KHQR"],
      default: "BAKONG_KHQR",
    },

    /* Payment INFO */
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
        type: Number, 
      },
      qrString: String,
      hash: String, // MD5 
      txHash: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
