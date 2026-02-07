import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { sendPaymentStatusTelegram, sendAdminAlert } from "../services/telegram.service.js";
import { generateBakongStatusHash } from "../utils/md5.js";
import axios from "axios";

const CANCEL_AFTER_MS = 5 * 60 * 1000; // 5 Minutes 
const CHECK_PAID_LIMIT_MS = 10 * 1000;

export const startPaymentPolling = () => {
  console.log("Bakong Background Poller Started");

  setInterval(async () => {
    try {
      /* Check Bakong for Paid, Pending orders (so Telegram works even if client stops polling)*/
      const pendingOrders = await Order.find({
        status: "PENDING",
        isPaid: false,
      }).limit(50);

      for (const order of pendingOrders) {
        try {
          const paymentRecord = await Payment.findOne({ orderId: order._id });
          if (paymentRecord && (paymentRecord.status === "PAID" || paymentRecord.txHash)) {
            order.isPaid = true;
            order.status = "PAID";
            order.payment = {
              ...order.payment,
              status: "PAID",
              txHash: paymentRecord.txHash || order.payment?.txHash || "confirmed"
            };
            order.telegramNotify = true;
            await order.save();
            await Payment.findOneAndUpdate(
              { orderId: order._id },
              {
                status: "PAID",
                txHash: order.payment.txHash
              }
            );

            await sendPaymentStatusTelegram(order, "PAID");
            console.log(`Poller: Order ${order._id} reconciled as PAID from Payment record.`);
            continue;
          }
        } catch (err) {
          console.error(`Poller: reconciliation failed for order ${order._id}:`, err.message);
        }

        /* Skip if missing QR string (can't verify) */
        if (!order.payment?.qrString) continue;
        if (order.telegramNotify === true) continue;
        try {
          const resp = await axios.post(
            `${process.env.PYTHON_BAKONG_URL}/check-payment`,
            {
              qr_string: order.payment.qrString,
              md5_hash: generateBakongStatusHash(order.payment.qrString),
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: CHECK_PAID_LIMIT_MS,
            }
          );

          const code = resp?.data?.responseCode;
          const respMsg = resp?.data?.responseMessage || "";
          const isPaid = code === 0 || code === "0";
          if ((code === 1 || code === "1") && /unauthor/i.test(respMsg)) {
            try {
              await sendAdminAlert(`Order: ${order._id}\nMessage: ${respMsg}\nAction: Please verify BAKONG_TOKEN in Python service.`);
            } catch (e) {
              console.error(`Poller: failed to send admin alert for order ${order._id}:`, e.message);
            }
            continue;
          }

          if (isPaid) {
            order.isPaid = true;
            order.status = "PAID";
            order.payment.status = "PAID";
            order.payment.txHash =
              resp.data?.data?.hash || resp.data?.data?.id || "confirmed";
            order.telegramNotify = true;
            await order.save();

            await Payment.findOneAndUpdate(
              { orderId: order._id },
              {
                status: "PAID",
                txHash: order.payment.txHash,
              }
            );

            await sendPaymentStatusTelegram(order, "PAID");
            console.log(`Poller: Order ${order._id} marked PAID.`);
          }
        } catch (e) {
          /* Don't fail the whole poller loop on one order/API error */
          console.error(
            `Poller: check-payment failed for order ${order._id}:`,
            e.response?.data?.responseMessage || e.message
          );
        }
      }

      /* Find orders that are PENDING and older than 5 minutes */
      const expirationDate = new Date(Date.now() - CANCEL_AFTER_MS);
      const ordersToCancel = await Order.find({
        status: "PENDING",
        createdAt: { $lte: expirationDate }
      });

      for (const order of ordersToCancel) {
        /* Before cancelling, confirm no late payment came through */
        try {
          /* Check payment record in MongoDB */
          const paymentRecord = await Payment.findOne({ orderId: order._id });
          if (paymentRecord && (paymentRecord.status === "PAID" || paymentRecord.txHash)) {
            const updatedPaidOrder = await Order.findByIdAndUpdate(
              order._id,
              {
                $set: {
                  status: "PAID",
                  isPaid: true,
                  "payment.status": "PAID",
                  "payment.txHash": paymentRecord.txHash || order.payment?.txHash || "confirmed",
                  telegramNotify: true
                }
              },
              { new: true }
            );

            if (updatedPaidOrder) {
              await Payment.findOneAndUpdate({ orderId: order._id }, { status: "PAID", txHash: updatedPaidOrder.payment.txHash });
              await sendPaymentStatusTelegram(updatedPaidOrder, "PAID");
              console.log(`Poller: Order ${order._id} received late payment and marked PAID before cancel.`);
              continue;
            }
          }

          /* If no DB proof, try Bakong check if qrString available */
          if (order.payment?.qrString) {
            try {
              const resp = await axios.post(
                `${process.env.PYTHON_BAKONG_URL}/check-payment`,
                {
                  qr_string: order.payment.qrString,
                  md5_hash: generateBakongStatusHash(order.payment.qrString),
                },
                {
                  headers: { "Content-Type": "application/json" },
                  timeout: CHECK_PAID_LIMIT_MS,
                }
              );

              const code = resp?.data?.responseCode;
              const respMsg = resp?.data?.responseMessage || "";
              const isPaid = code === 0 || code === "0";

              if ((code === 1 || code === "1") && /unauthor/i.test(respMsg)) {
                try {
                  await sendAdminAlert(`Order pre-cancel check: ${order._id}\nMessage: ${respMsg}\nAction: Please verify BAKONG_TOKEN in Python service.`);
                } catch (e) {
                  console.error(`Poller: failed to send admin alert for order ${order._id}:`, e.message);
                }
                continue;
              }

              if (isPaid) {
                const txHash = resp.data?.data?.hash || resp.data?.data?.id || "confirmed";
                const updatedPaidOrder = await Order.findByIdAndUpdate(
                  order._id,
                  {
                    $set: {
                      status: "PAID",
                      isPaid: true,
                      "payment.status": "PAID",
                      "payment.txHash": txHash,
                      telegramNotify: true
                    }
                  },
                  { new: true }
                );

                if (updatedPaidOrder) {
                  await Payment.findOneAndUpdate({ orderId: order._id }, { status: "PAID", txHash });
                  await sendPaymentStatusTelegram(updatedPaidOrder, "PAID");
                  console.log(`Poller: Order ${order._id} received late payment (Bakong) and marked PAID before cancel.`);
                  continue;
                }
              }
            } catch (err) {
              console.error(`Poller: late-payment check failed for order ${order._id}:`, err.message);
            }
          }
        } catch (err) {
          console.error(`Poller: pre-cancel checks failed for order ${order._id}:`, err.message);
        }
        const updatedOrder = await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              status: "CANCELLED",
              "payment.status": "FAILED",
              telegramNotify: true
            }
          },
          { new: true }
        );

        if (updatedOrder) {
          await Payment.updateOne({ orderId: order._id }, { status: "FAILED" });
          await sendPaymentStatusTelegram(updatedOrder, "CANCELLED");
          console.log(`Poller: Order ${order._id} auto-cancelled.`);
        }
      }
    } catch (error) {
      console.error("Poller Error:", error.message);
    }
  }, 60000);
};