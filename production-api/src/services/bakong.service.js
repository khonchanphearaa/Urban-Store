import axios from "axios";
import { BAKONG_SERVICE_URL } from "../config/bakong.js";

console.log("Bakong Service URL =", BAKONG_SERVICE_URL); // 👈 ADD THIS

export const createBakongQR = async (orderId, amount) => {
  const res = await axios.post(
    `${BAKONG_SERVICE_URL}/create-qr`,
    { orderId, amount }
  );
  return res.data;
};
