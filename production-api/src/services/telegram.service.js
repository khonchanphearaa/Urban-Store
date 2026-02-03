import axios from "axios";

export const sendPaymentStatusTelegram = async (order, status) => {
  try {
    const isPaid = status === "PAID";
    const header = isPaid ? "✅ <b>PAYMENT SUCCESSFUL</b>" : "⚠️ <b>PAYMENT EXPIRED/CANCELLED</b>";
    const statusText = isPaid ? "🟢 PAID" : "🔴 CANCELLED";

    /* Format items list with prices if available */
    const items = order.items?.map(i =>
      `• ${i.name} (x${i.quantity})`
    ).join("\n") || "No items listed";

    const message = `
${header}
━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${order._id}</code>
📦 <b>Items:</b>
${items}

💰 <b>Final Amount:</b> <b>${(order.payment?.amount || 0).toLocaleString()} ៛</b>
🚥 <b>Status:</b> <b>${statusText}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${order.phoneNumber || 'N/A'}
📍 <b>Address:</b> ${order.deliveryAddress || 'N/A'}
🕒 <b>Time:</b> ${new Date().toLocaleString('en-GB')}
━━━━━━━━━━━━━━━━━━
`.trim();

    const response = await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TG_CHAT_ID,
      text: message,
      parse_mode: "HTML"
    });

    return response.data;
  } catch (error) {
    console.error("Telegram Service Error:", error.response?.data || error.message);
  }
};

/* Technical Alert (For Bakong Token expiration or API downtime) */
export const sendAdminAlert = async (message) => {
  try {
    const text = `<b>SYSTEM ALERT: BAKONG SERVICE</b>\n\n${message}\n\n ${new Date().toLocaleString()}`;
    await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TG_CHAT_ID, 
      text,
      parse_mode: "HTML"
    });
  } catch (err) {
    console.error("Telegram Admin Alert Error:", err.message);
  }
};