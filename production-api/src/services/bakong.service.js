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

  return res.data;
};
