export const orderResponse = (order) => ({
  orderId: order._id,
  status: order.status,
  isPaid: order.isPaid,

  payment: {
    method: order.payment.method,
    status: order.payment.status,
    currency: order.payment.currency,
    amount: order.payment.amount,
  },

  summary: {
    totalPrice: order.totalPrice,
    totalQuantity: order.totalQuantity,
  },

  delivery: {
    address: order.deliveryAddress,
    phone: order.phoneNumber,
  },

  createdAt: order.createdAt,
});
