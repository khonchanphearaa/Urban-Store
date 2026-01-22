import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import { createBakongQR } from "../services/bakong.service.js";
import { generatePaymentHash } from "../utils/md5.js";

/* CREATE Payment Bakong Khqr */
export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "Order already processed",
      });
    }

    const amount = order.finalAmount;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount",
      });
    }

    // Generate MD5 integrity hash 
    const hash = generatePaymentHash({
      orderId: order._id.toString(),
      amount,
      currency: "KHR",
    });

    const payment = await Payment.create({
      orderId: order._id,
      amount,
      method: "BAKONG_KHQR",
      status: "PENDING",
      hash,
    });

    /* Generate Bakong KHQR (Python service) */
    const qr = await createBakongQR(
      order._id.toString(),
      amount
    );

    order.payment = {
      method: "BAKONG_KHQR",
      status: "PENDING",
      currency: "KHR",
      amount,
      qrString: qr.qr_string,
      hash,
    };

    await order.save();
    res.json({
      success: true,
      orderId: order._id,
      paymentId: payment._id,
      amount,
      qr_string: qr.qr_string,
    });

  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ message: "Payment failed" });
  }
};

/* RETRY Payment new qr */
export const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "CANCELLED") {
      return res.status(400).json({
        message: "Only cancelled orders can retry payment",
      });
    }

    const amount = order.finalAmount;

    // Generate new MD5
    const hash = generatePaymentHash({
      orderId: order._id.toString(),
      amount,
      currency: "KHR",
    });

    // Generate new QR
    const qr = await createBakongQR(
      order._id.toString(),
      amount
    );

    // Reset order payment state
    order.status = "PENDING";
    order.isPaid = false;
    order.payment = {
      method: "BAKONG_KHQR",
      status: "PENDING",
      currency: "KHR",
      amount,
      qrString: qr.qr_string,
      hash,
    };

    await order.save();

    res.json({
      success: true,
      message: "Payment retry started",
      orderId: order._id,
      amount,
      qr_string: qr.qr_string,
    });

  } catch (error) {
    console.error("Retry payment error:", error);
    res.status(500).json({ message: "Retry payment failed" });
  }
};

