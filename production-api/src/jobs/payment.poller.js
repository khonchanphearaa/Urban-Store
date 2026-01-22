import Order from "../models/Order";
import Payment from "../models/Payment";

const AUTO_PAY_AFTER_MS = 60 * 1000; /* demo: 1 minute */
const CANCEL_AFTER_MS = 10 * 60 * 100

export const startPaymentPolling = () => {
  console.log("PAYMENT Poller started!");

  /* GET START TIMER */
  setInterval(async () => {
    try {
      const now = Date.now();

      const orders = await Order.find({
        status: "PENDING",
        "payment.method": "BAKONG_KHQR",
      });
      for (const order of orders) {
        const elapsed_Timer = now - new Date(order.updatedAt).getTime();

        /* CANCEL PAYMENTs */
        if (elapsed_Timer > CANCEL_AFTER_MS) {
          order.status = "CANCELLED";
          order.payment.status = "FAILED";
          await order.save();

          await Payment.updateOne(
            { orderId: order._id },
            { status: "FAILED" }
          );
          console.log("Cancel: ", order._id);
          continue;
        }

        /* AUTO CHECK STATUS IF SUCCESS */
        if (elapsed_Timer > AUTO_PAY_AFTER_MS) {
          order.status = "PAID";
          order.payment.status = "PAID";
          order.isPaid = true;
          await order.save();

          await Payment.updateOne(
            { orderId: order._id },
            { status: "PAID" }
          );
          console.log("Payment Paid: ", order._id);
        }
      }
    } catch (error) {
      console.error("Polling Error: ", error);
    }
  }, 15000);
};