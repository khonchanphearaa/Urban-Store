import axios from "axios";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { createBakongQR } from "../services/bakong.service.js";
import { generatePaymentHash, generateBakongStatusHash } from "../utils/md5.js";
import { sendPaymentStatusTelegram, sendAdminAlert } from "../services/telegram.service.js";

//#region Create Payment Generat KHQR
export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    const amount = order.finalAmount;

    /* Generate Security Hash */
    const hash = generatePaymentHash({
      orderId: order._id.toString(),
      amount,
      currency: "KHR",
    });

    /* Create Bakong QR from Service */
    const qr = await createBakongQR(order._id.toString(), amount);

    /* Update Order Object */
    order.status = "PENDING";
    order.payment = {
      method: "BAKONG_KHQR",
      status: "PENDING",
      currency: "KHR",
      amount,
      qrString: qr.qr_string,
      hash,
    };

    /* Important for Mongoose to track object updates */
    order.markModified('payment'); 
    await order.save();

    /* Create separate Payment Record for history */
    const payment = await Payment.create({
      orderId: order._id,
      amount,
      method: "BAKONG_KHQR",
      status: "PENDING",
      hash,
    });
    res.json({
      success: true,
      orderId: order._id,
      paymentId: payment._id,
      qr_string: qr.qr_string,
      amount,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({ message: "Payment generation failed", error: error.message });
  }
};
//#endregion


//#region Check Payment Status md5 status
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    /* Check validation status required */
    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }
    if (order.isPaid || order.status === "PAID") {
      return res.json({ success: true, status: "PAID" });
    }
    if (order.status === "CANCELLED") {
      return res.json({ success: true, status: "CANCELLED" });
    }
    if (!order.payment?.qrString) {
      return res.status(400).json({ message: "QR String not found in database" });
    }

    /* generate md5 status bakong */
    const bakongMd5 = generateBakongStatusHash(order.payment.qrString);
    console.log("Checking payment status:", {
      orderId: order._id,
      qr_string: order.payment.qrString,
      bakongMd5: bakongMd5
    });

    /* CALL: Python Bakong_khqr_Service to check bakong API */
    console.log("Calling Python Bakong Service to verify payment...");
    const response = await axios.post(
      `${process.env.PYTHON_BAKONG_URL}/check-payment`,
      { 
        qr_string: order.payment.qrString,
        md5_hash: bakongMd5
      },
      {timeout: 60000}  /* 60 seconds = 1 minutes timeout for slow API response */
    );
    /* Log bakong response error */
    console.log("Bakong Response:", {
      responseCode: response.data.responseCode,
      responseMessage: response.data.responseMessage,
      data: response.data.data
    });
    const respCode = response.data.responseCode;
    const respMsg = response.data.responseMessage || "";
    if ((respCode === 1 || respCode === "1") && /unauthor/i.test(respMsg)) {
      console.error(`Bakong Unauthorized for order ${order._id}: ${respMsg}`);
      try {
        await sendAdminAlert(`Order: ${order._id}\nMessage: ${respMsg}\nAction: Please verify BAKONG_TOKEN in the Python service and restart.`);
      } catch (e) {
        console.error("Failed to send admin alert:", e.message);
      }

      return res.status(502).json({ success: false, message: "Bakong Unauthorized - admin notified" });
    }

    /* Login success if (responseCode is 0 mean transaction found/confirmed) */
    if (response.data.responseCode === 0 || response.data.responseCode === "0") {
      console.log("Payment verified! Updating status to PAID");
      order.isPaid = true;
      order.status = "PAID";
      order.payment.status = "PAID";
      order.payment.txHash = response.data.data?.hash || response.data.data?.id || "confirmed";
      await order.save();
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        { 
          status: "PAID",
          txHash: response.data.data?.hash || "confirmed"
        },
        { new: true }
      );

      /* Telegram Notify */
      if (!order.telegramNotify) {
        console.log("Sending Telegram notification...");
        await sendPaymentStatusTelegram(order, "PAID");
        order.telegramNotify = true;
        await order.save();
      }

      return res.json({ success: true, status: "PAID" });
    }

    /*Logic for AUTO-CANCEL 5 minute */
    const minutesSinceCreated = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    
    console.log(`Time elapsed: ${minutesSinceCreated.toFixed(2)} minutes (limit: 15 minutes)`);
    if (minutesSinceCreated > 15) { 
      console.log("Payment expired - cancelling order");
      order.status = "CANCELLED";
      order.payment.status = "FAILED";
      await order.save();

      /* Update Payment collection record */
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        { status: "FAILED" },
        { new: true }
      );

      /* Telegram Notify for Cancellation (avoid duplicates) */
      if (!order.telegramNotify) {
        await sendPaymentStatusTelegram(order, "CANCELLED");
        order.telegramNotify = true;
        await order.save();
      }
      return res.json({ success: true, status: "CANCELLED" });
    }

    /*Logic for PENDING */
    console.log("Payment still pending - waiting for confirmation");
    res.json({ success: true, status: "PENDING" });

  } catch (error) {
    const errorStatus = error.response?.status || 500;
    const errorMessage = error.response?.data?.responseMessage || error.message;
    const fullErrorData = error.response?.data;
    if ((error.response?.status === 401) || /unauthor/i.test(errorMessage)) {
      try {
        await sendAdminAlert(`Order: ${req.body?.orderId || 'unknown'}\nError: ${errorMessage}\nAction: Please verify BAKONG_TOKEN in the Python service.`);
      } catch (e) {
        console.error("Failed to send admin alert:", e.message);
      }
    }

    console.error("Bakong API Error Details:", {
      status: errorStatus,
      message: errorMessage,
      fullResponse: fullErrorData,
      token_sent: !!process.env.BAKONG_TOKEN,
      token_format: process.env.BAKONG_TOKEN ? `Bearer ${process.env.BAKONG_TOKEN?.substring(0, 10)}...` : "MISSING"
    });

    res.status(errorStatus).json({ 
        success: false, 
        message: "Check status failed", 
        error: errorMessage,
        debug: {
          bakongStatus: errorStatus,
          tokenMissing: !process.env.BAKONG_TOKEN,
          tokenLength: process.env.BAKONG_TOKEN?.length || 0
        }
    });
  }
};
//#endregion


//#region Retry Payment Generate New KHQR
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
    const hash = generatePaymentHash({
      orderId: order._id.toString(),
      amount,
      currency: "KHR",
    });
    const qr = await createBakongQR(
      order._id.toString(),
      amount
    );
    order.status = "PENDING";
    order.isPaid = false;
    order.telegramNotify = false;
    order.payment = {
      method: "BAKONG_KHQR",
      status: "PENDING",
      currency: "KHR",
      amount,
      qrString: qr.qr_string,
      hash,
    };

    await order.save();
    await Payment.create({
      orderId: order._id,
      amount,
      method: "BAKONG_KHQR",
      status: "PENDING",
      hash,
    });

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
//#endregion