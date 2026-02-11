import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { sendPaymentStatusTelegram, sendAdminAlert } from "../services/telegram.service.js";
import axios from "axios";

const CANCEL_AFTER_MS = 5 * 60 * 1000; // 5 Minutes (matching controller logic)
const CHECK_PAID_LIMIT_MS = 10 * 1000; // 10 seconds timeout
const POLLER_INTERVAL_MS = 60000; // 60 seconds = 1 minute

export const startPaymentPolling = () => {
  console.log("🔄 Bakong Background Poller Started");

  setInterval(async () => {
    try {
      /* Check Bakong for Paid, Pending orders (so Telegram works even if client stops polling)*/
      const pendingOrders = await Order.find({
        status: "PENDING",
        isPaid: false,
      }).limit(50);

      if (pendingOrders.length > 0) {
        console.log(`🔍 Poller: Checking ${pendingOrders.length} pending orders...`);
      }

      for (const order of pendingOrders) {
        try {
          /* First: Check if Payment record already shows PAID (fast DB lookup) */
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
            console.log(` Poller: Order ${order._id} reconciled as PAID from Payment record.`);
            continue;
          }
        } catch (err) {
          console.error(` Poller: reconciliation failed for order ${order._id}:`, err.message);
        }

        /* Skip if missing QR string or MD5 (can't verify without MD5) */
        if (!order.payment?.qrString) {
          console.log(`Poller: Order ${order._id} missing QR string, skipping...`);
          continue;
        }

        /* FIX: Use stored MD5 hash instead of generating it */
        if (!order.payment?.md5) {
          console.log(`Poller: Order ${order._id} missing MD5 hash, skipping...`);
          continue;
        }

        /* Skip if already notified via Telegram */
        if (order.telegramNotify === true) continue;

        try {
          /* Use stored MD5 hash from database */
          const resp = await axios.post(
            `${process.env.PYTHON_BAKONG_URL}/check-payment`,
            {
              qr_string: order.payment.qrString,
              md5_hash: order.payment.md5,  // Use stored MD5
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: CHECK_PAID_LIMIT_MS,
            }
          );

          const code = resp?.data?.responseCode;
          const respMsg = resp?.data?.responseMessage || "";
          const isPaid = code === 0 || code === "0";

          /* Handle unauthorized error */
          if ((code === 1 || code === "1") && /unauthor/i.test(respMsg)) {
            try {
              await sendAdminAlert(`Order: ${order._id}\nMessage: ${respMsg}\nAction: Please verify BAKONG_TOKEN in Python service.`);
            } catch (e) {
              console.error(` Poller: failed to send admin alert for order ${order._id}:`, e.message);
            }
            continue;
          }

          /* Payment found and confirmed */
          if (isPaid) {
            const txHash = resp.data?.data?.hash || resp.data?.data?.id || "confirmed";
            
            order.isPaid = true;
            order.status = "PAID";
            order.payment.status = "PAID";
            order.payment.txHash = txHash;
            order.telegramNotify = true;
            await order.save();

            await Payment.findOneAndUpdate(
              { orderId: order._id },
              {
                status: "PAID",
                txHash: txHash,
              }
            );

            await sendPaymentStatusTelegram(order, "PAID");
            console.log(` Poller: Order ${order._id} marked PAID with tx: ${txHash}`);
          }
        } catch (e) {
          /* Don't fail the whole poller loop on one order/API error */
          console.error(
            ` Poller: check-payment failed for order ${order._id}:`,
            e.response?.data?.responseMessage || e.message
          );
        }
      }

      /* AUTO-CANCEL: Find orders that are PENDING and older than 15 minutes */
      const expirationDate = new Date(Date.now() - CANCEL_AFTER_MS);
      const ordersToCancel = await Order.find({
        status: "PENDING",
        createdAt: { $lte: expirationDate }
      });

      if (ordersToCancel.length > 0) {
        console.log(`⏰ Poller: Found ${ordersToCancel.length} orders to cancel (>15min old)`);
      }

      for (const order of ordersToCancel) {
        /* Before cancelling, do final check for late payment */
        try {
          /* Check payment record in MongoDB first */
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
              await Payment.findOneAndUpdate(
                { orderId: order._id }, 
                { status: "PAID", txHash: updatedPaidOrder.payment.txHash }
              );
              await sendPaymentStatusTelegram(updatedPaidOrder, "PAID");
              console.log(`✅ Poller: Order ${order._id} received late payment and marked PAID before cancel.`);
              continue;
            }
          }

          /* If no DB proof, try Bakong check if qrString and MD5 available */
          if (order.payment?.qrString && order.payment?.md5) {
            try {
              /* Use stored MD5 hash */
              const resp = await axios.post(
                `${process.env.PYTHON_BAKONG_URL}/check-payment`,
                {
                  qr_string: order.payment.qrString,
                  md5_hash: order.payment.md5,  // Use stored MD5
                },
                {
                  headers: { "Content-Type": "application/json" },
                  timeout: CHECK_PAID_LIMIT_MS,
                }
              );

              const code = resp?.data?.responseCode;
              const respMsg = resp?.data?.responseMessage || "";
              const isPaid = code === 0 || code === "0";

              /* Handle unauthorized error */
              if ((code === 1 || code === "1") && /unauthor/i.test(respMsg)) {
                try {
                  await sendAdminAlert(`Order pre-cancel check: ${order._id}\nMessage: ${respMsg}\nAction: Please verify BAKONG_TOKEN in Python service.`);
                } catch (e) {
                  console.error(` Poller: failed to send admin alert for order ${order._id}:`, e.message);
                }
                continue;
              }

              /* Payment found just before cancellation */
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
                  await Payment.findOneAndUpdate(
                    { orderId: order._id }, 
                    { status: "PAID", txHash }
                  );
                  await sendPaymentStatusTelegram(updatedPaidOrder, "PAID");
                  console.log(` Poller: Order ${order._id} received late payment (Bakong) and marked PAID before cancel.`);
                  continue;
                }
              }
            } catch (err) {
              console.error(` Poller: late-payment check failed for order ${order._id}:`, err.message);
            }
          } else {
            console.log(` Poller: Order ${order._id} missing QR or MD5, cannot verify before cancel`);
          }
        } catch (err) {
          console.error(` Poller: pre-cancel checks failed for order ${order._id}:`, err.message);
        }

        /* Proceed with cancellation */
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
          console.log(` Poller: Order ${order._id} auto-cancelled (expired after 15 minutes).`);
        }
      }
    } catch (error) {
      console.error(" Poller Error:", error.message);
    }
  }, POLLER_INTERVAL_MS);
};