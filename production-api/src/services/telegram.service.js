import axios from "axios";

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

export const sendPaymentSuccessTelegram = async (order) => {
  const items = order.items.map(i =>
    `• ${i.name} x${i.quantity} = ${(i.price * i.quantity).toLocaleString()} ៛`
  ).join("\n");

  let discountText = "No discount";
  if (order.discount.type === "FIXED")
    discountText = `-${order.discount.value.toLocaleString()} ៛`;
  if (order.discount.type === "PERCENT")
    discountText = `-${order.discount.value}% (${order.discount.amount.toLocaleString()} ៛)`;

  const message = `
        ✅ <b>PAYMENT SUCCESS</b>
        🧾 Order ID: <b>${order._id}</b>
        📦 Items:
        ${items}

        💰 Subtotal: ${order.totalPrice.toLocaleString()} ៛
        🏷 Discount: ${discountText}
        💵 Final: <b>${order.finalAmount.toLocaleString()} ៛</b>
        💳 Bakong KHQR
        📞 ${order.phoneNumber}
        📍 ${order.deliveryAddress}

        ⏰ ${new Date().toLocaleString()}
    `;

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    }
  );
};
