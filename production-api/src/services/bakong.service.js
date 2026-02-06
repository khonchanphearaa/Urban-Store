import axios from "axios";
import { BAKONG_SERVICE_URL } from "../config/bakong.js";

console.log("Bakong Service URL =", BAKONG_SERVICE_URL);

export const createBakongQR = async (orderId, amount) => {
  const res = await axios.post(
    `${BAKONG_SERVICE_URL}/create-qr`,
    {
      order_id: orderId,   
      amount,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Normalize response for compatibility with different Python service shapes
  const data = res.data;
  console.log("Bakong service raw response:", data);

  // If the Python service wrapped the qr data as an object (legacy shape), extract it
  if (data && data.qr_string && typeof data.qr_string === "object") {
    const normalized = {
      qr_string: data.qr_string.qr_string,
      md5: data.qr_string.md5,
      ...data,
    };
    console.log("Bakong service normalized response:", normalized);
    return normalized;
  }

  return data;
};
