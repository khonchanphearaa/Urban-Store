import crypto from "crypto";

export const generatePaymentHash = ({ orderId, amount, currency }) => {
  const raw = `${orderId}|${amount}|${currency}|BAKONG`;
  return crypto.createHash("md5").update(raw).digest("hex");
};
