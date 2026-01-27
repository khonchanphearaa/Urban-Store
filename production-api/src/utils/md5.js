import crypto from "crypto";

export const generatePaymentHash = ({ orderId, amount, currency }) => {
  
  /* Bakong production secret key */
  const secretKey = process.env.BAKONG_SECRET_KEY;
  if(!secretKey){
    throw new Error("BAKONG_SECRET_KEY is not defined");
  }
  const raw = `${orderId}|${amount}|${currency}|${secretKey}`;
  return crypto.createHash("md5").update(raw).digest("hex");
};
