import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { orderResponse } from "../utils/orderResponse.js";

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      deliveryAddress,
      phoneNumber,
      paymentMethod,
      discountPercent = 0,
    } = req.body;

    if (!deliveryAddress || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Delivery address and phone number are required!" });
    }

    // Validate percent
    if (discountPercent < 0 || discountPercent > 100) {
      return res
        .status(400)
        .json({ message: "Discount percent must be between 0 and 100" });
    }

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    let totalQuantity = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session);
      if (!product) throw new Error("Product not found!");

      if (item.quantity > product.stock) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save({ session });

      const price = Number(product.price);
      const quantity = Number(item.quantity);

      if (Number.isNaN(price) || Number.isNaN(quantity)) {
        throw new Error("Invalid product price or quantity");
      }

      orderItems.push({
        product: product._id,
        price,
        quantity,
      });

      totalPrice += price * quantity;
      totalQuantity += quantity;
    }

    // STATIC PERCENT DISCOUNT
    const discountAmount = Math.floor(
      (totalPrice * discountPercent) / 100
    );

    // FINAL PAYABLE AMOUNT
    const finalAmount = totalPrice - discountAmount;

    // CREATE ORDER
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

    /* Clear cart */
    await Cart.deleteOne({ user: req.user._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    // CLEAN RESPONSE
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order._id,
        totalPrice,
        discountPercent,
        discountAmount,
        finalAmount,
        status: order.status,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};



// Get User Orders (USER)
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate("items.product");
    res.json({ message: "Orders fetched", orders });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

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
