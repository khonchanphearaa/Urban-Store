import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { orderResponse } from "../utils/orderResponse.js";

/* CREATE ORDER */
export const createOrder = async (req, res) => {
  const {
    deliveryAddress,
    phoneNumber,
    paymentMethod,
    discountPercent = 0,
  } = req.body;

  // ✅ VALIDATE FIRST (before transaction)
  if (!deliveryAddress || !phoneNumber) {
    return res.status(400).json({
      message: "Delivery address and phone number are required",
    });
  }

  if (discountPercent < 0 || discountPercent > 100) {
    return res.status(400).json({
      message: "Discount percent must be between 0 and 100",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let totalPrice = 0;
    let totalQuantity = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session);
      if (!product) throw new Error("Product not found");

      if (item.quantity > product.stock) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalPrice += product.price * item.quantity;
      totalQuantity += item.quantity;
    }

    const discountAmount = Math.floor(
      (totalPrice * discountPercent) / 100
    );

    const finalAmount = totalPrice - discountAmount;

    const [order] = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          totalPrice,
          totalQuantity,
          discount: {
            type: "PERCENT",
            value: discountPercent,
            amount: discountAmount,
          },
          finalAmount,
          deliveryAddress,
          phoneNumber,
          paymentMethod: paymentMethod || "BAKONG_KHQR",
          payment: {
            method: "BAKONG_KHQR",
            status: "PENDING",
            currency: "KHR",
            amount: finalAmount,
          },
          status: "PENDING",
          isPaid: false,
        },
      ],
      { session }
    );

    await Cart.deleteOne({ user: req.user._id }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      finalAmount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

/* GET USER ORDERS */
export const getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json({ success: true, orders });
};



// Get User Orders (USER)
// export const getUserOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user._id }).populate("items.product");
//     res.json({ message: "Orders fetched", orders });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

/* GET orderbyID */
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json({
    success: true,
    order: orderResponse(order),
  });
};


// UPDATE Order Status (Admin)
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
