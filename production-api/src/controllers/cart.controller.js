import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/*  GET User Cart */
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );
    if (!cart) return res.json({ message: "Cart is empty", items: [] });
    res.json({ message: "Cart fetched", items: cart.items });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ADD Item to Cart */
export const addToCart = async (req, res) => {
  try {
    let { productId, quantity } = req.body;
    quantity = Number(quantity) || 1;

    console.log("ADD CART USER:", req.user._id);

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (quantity > product.stock)
      return res.status(400).json({ message: "Not enough stock available" });

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (item) {
      if (item.quantity + quantity > product.stock)
        return res.status(400).json({
          message: "Quantity exceeds available stock",
        });
      item.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    res.json({
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.error("ADD CART ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// UPDATE Cart Item
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    /* find: productbyid update */
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found!" });

    /* update: qty > product stock */
    if (quantity > product.stock)
      return res
        .status(400)
        .json({ message: "Quantity exceeds avaliable stock" });

    item.quantity = quantity;
    await cart.save();

    res.json({
      message: "Cart item updated!",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* REMOVE item cart */
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Optional: delete cart if empty
    if (cart.items.length === 0) {
      await cart.deleteOne();
      return res.json({ message: "Cart is now empty" });
    }

    await cart.save();

    res.json({
      message: "Cart item removed",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
