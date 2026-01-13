import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Get User Cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) return res.json({ message: "Cart is empty", items: [] });
    res.json({ message: "Cart fetched", items: cart.items });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Add Item to Cart
export const addToCart = async (req, res) => {
  try {
    let { productId, quantity } = req.body;
    quantity = Number(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    
    /* alert quanity cart if > stock product (Stock check) */
    if (!cart) {
      if(quantity > product.stock){
      return res.status(400).json({message: "Not enough stock avaliable!"});
    }

    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, quantity }]
    });
    
    } else {
      const item = cart.items.find(i => i.product.toString() === productId);
      if (item) {
        
        /* fix: if qty > stock */
        if(item.quantity + quantity > product.stock)
          return res.status(400).json({message: "Quantity exceeds avaliable stock!"});
        item.quantity += quantity;
      } else {
        
        /* check: status qty */
        if(quantity > product.stock)
          return res.status(400).json({message: "Not enough stock avaliable!"});
        cart.items.push({ product: productId, quantity });
      }
      await cart.save();
    }

    res.json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Cart Item
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      i => i.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    /* find: productbyid update */
    const product = await Product.findById(productId);
    if(!product)
      return res.status(404).json({message: "Product not found!"});

    /* update: qty > product stock */
    if(quantity > product.stock)
      return res.status(400).json({message: "Quantity exceeds avaliable stock"});
    

    item.quantity = quantity;
    await cart.save();

    res.json({
      message: "Cart item updated!",
      cart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REMOVE CART
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    //  Optional: delete cart if empty
    if (cart.items.length === 0) {
      await cart.deleteOne();
      return res.json({ message: "Cart is now empty" });
    }

    await cart.save();

    res.json({
      message: "Cart item removed",
      cart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
