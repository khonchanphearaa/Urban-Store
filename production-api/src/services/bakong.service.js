import axios from "axios";
import { BAKONG_SERVICE_URL } from "../config/bakong.js";

console.log("Bakong Service URL =", BAKONG_SERVICE_URL);

export const createBakongQR = async (orderId, amount) => {
  try {
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
        timeout: 20000,
      }
    );

    const data = res.data;
    console.log("Bakong service raw response:", data);

    // Validate response has required fields
    if (!data.qr_string) {
      throw new Error("Invalid response: missing qr_string");
    }
    
    if (!data.md5) {
      throw new Error("Invalid response: missing md5 hash");
    }

    // Return normalized response
    return {
      qr_string: data.qr_string,
      md5: data.md5
    };

  } catch (err) {
    console.error("Bakong service create-qr error:", err?.response?.status, err?.response?.data || err.message);
    if (err.response) {
      // HTTP error from Python service
      const status = err.response.status;
      const body = err.response.data;
      throw new Error(`Bakong service HTTP ${status}: ${JSON.stringify(body)}`);
    }
    // Network or other error
    throw new Error(`Bakong service request failed: ${err.message}`);
  }
};