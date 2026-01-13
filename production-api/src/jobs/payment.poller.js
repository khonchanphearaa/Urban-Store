import Order from "../models/Order.js";
import { generatePaymentHash } from "../utils/md5.js";

const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000; // ⏳ 10 minutes

export const startPaymentPolling = () => {
  setInterval(async () => {
    try {
      const pendingOrders = await Order.find({
        status: "PENDING",
        "payment.method": "BAKONG_KHQR",
      });

      for (const order of pendingOrders) {
        const now = Date.now();
        const createdAt = new Date(order.updatedAt).getTime();
        const elapsed = now - createdAt;

        // 🔴 TIMEOUT → AUTO CANCEL
        if (elapsed > PAYMENT_TIMEOUT_MS) {
          order.status = "CANCELLED";
          order.payment.status = "FAILED";
          await order.save();

          console.log("⛔ Auto-cancel order:", order._id);
          continue;
        }

        // 🔐 MD5 integrity check
        const expectedHash = generatePaymentHash({
          orderId: order._id.toString(),
          amount: order.totalPrice,
          currency: "KHR",
        });

        if (order.payment.hash !== expectedHash) continue;

        // ✅ AUTO MARK PAID (assumed success)
        order.status = "PAID";
        order.payment.status = "PAID";
        order.isPaid = true;

        await order.save();
        console.log("✅ Auto-paid order:", order._id);
      }
    } catch (err) {
      console.error("❌ Polling error:", err);
    }
  }, 30000); // 🔁 every 30 seconds
};
