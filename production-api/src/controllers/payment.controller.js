import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import { createBakongQR } from "../services/bakong.service.js";
import { generatePaymentHash } from "../utils/md5.js";

export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    /* Check order status */
    if (order.status !== "PENDING") {
      return res.status(400).json({ message: "Order already processed" });
    }

    /* Generate internal MD5 hash (integrity) */
    const hash = generatePaymentHash({
      orderId: order._id.toString(),
      amount: order.totalPrice, // KHR
      currency: "KHR",
    });

    /* Create payment record */
    const payment = await Payment.create({
      orderId: order._id,
      amount: order.totalPrice, // KHR
      method: "BAKONG_KHQR",
      status: "PENDING",
      hash, // internal integrity hash
    });

    /*  CALL Python Bakong khqr service */
    const qr = await createBakongQR(
      order._id.toString(),
      order.totalPrice
    );

    /* Save payment info into order */
    order.payment = {
      method: "BAKONG_KHQR",
      status: "PENDING",
      currency: "KHR",
      amount: order.totalPrice,
      qrString: qr.qr_string,
      hash,
    };
    await order.save();

    res.json({
      success: true,
      orderId: order._id,
      paymentId: payment._id,
      amount: order.totalPrice,
      qr_string: qr.qr_string,
    });

  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ message: "Payment failed" });
  }
};
