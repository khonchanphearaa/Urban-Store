import axios from "axios";

export const sendPaymentStatusTelegram = async (order, status) => {
  try {
    let header, statusText;

    if (status === "PAID") {
      header = "✅ <b>PAYMENT SUCCESSFUL</b>";
      statusText = "🟢 PAID";
    } else if (status === "PENDING") {
      header = "⏳ <b>NEW PAYMENT PENDING</b>";
      statusText = "🟡 WAITING FOR CUSTOMER";
    } else {
      header = "⚠️ <b>PAYMENT EXPIRED/CANCELLED</b>";
      statusText = "🔴 CANCELLED";
    }

    const items = order.items?.map(i => `• ${i.name} (x${i.quantity})`).join("\n") || "No items listed";

    const message = `
${header}
━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${order._id}</code>
📦 <b>Items:</b>
${items}

💰 <b>Final Amount:</b> <b>${(order.payment?.amount || 0).toLocaleString()} ៛</b>
🚥 <b>Status:</b> <b>${statusText}</b>
🔑 <b>MD5:</b> <code>${order.payment?.md5 || 'N/A'}</code>
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${order.phoneNumber || 'N/A'}
🕒 <b>Time:</b> ${new Date().toLocaleString('en-GB')}
━━━━━━━━━━━━━━━━━━
`.trim();

    await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TG_CHAT_ID,
      text: message,
      parse_mode: "HTML"
    });
  } catch (error) {
    console.error("Telegram Service Error:", error.message);
  }
};

export const sendAdminAlert = async (message) => {
  try {
    const chatId = process.env.TG_ADMIN_CHAT_ID || process.env.TG_CHAT_ID;
    if (!chatId || !process.env.TG_BOT_TOKEN) {
      console.error("sendAdminAlert: Missing TG_CHAT_ID or TG_BOT_TOKEN");
      return;
    }

    await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML"
    });
  } catch (error) {
    console.error("sendAdminAlert Error:", error?.message || error);
  }
};
