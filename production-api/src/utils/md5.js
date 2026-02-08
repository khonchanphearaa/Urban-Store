import crypto from "crypto";

/**
 * Generate payment hash for internal security validation
 * This is NOT the same as Bakong MD5 - this is for your own validation
 */
export const generatePaymentHash = ({ orderId, amount, currency }) => {
  const data = `${orderId}-${amount}-${currency}-${process.env.PAYMENT_SECRET}`;
  return crypto.createHash("md5").update(data).digest("hex");
};
