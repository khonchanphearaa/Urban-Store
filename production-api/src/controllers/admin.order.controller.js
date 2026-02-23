import Order from "../models/Order.js";
import { orderResponse } from "../utils/orderResponse.js";

/* GET all orders  */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* GET order by Id */
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      success: true,
      order: orderResponse(order),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* UPDATE ORDER STATUS (Admin) */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["PAID", "SHIPPED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    order.status = status;

    if (status === "PAID") {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    await order.save();
    res.json({ message: "Order updated", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};