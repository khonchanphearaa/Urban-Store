import crypto from "crypto";

export const generatePaymentHash = ({orderId, amount, currency}) =>{
  const secretKey = process.env.PAYMENT_SECRET_KEY;
  const raw = `${orderId}|${amount}|${currency}|${secretKey}`;
  return crypto.createHash("md5").update(raw).digest("hex");
};

export const generateBakongStatusHash = (qrString) =>{
  return crypto.createHash("md5").update(qrString).digest("hex");
}