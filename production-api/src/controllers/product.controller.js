import Product from "../models/Product.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// Create Product (Admin)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }
    const images = req.files.map(file => file.path);
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      stock,
      category,
      images,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* GET All product */
export const getProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc"
    } = req.query;

    const query = {};

    /* Search (name + description) */
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ];
    }

    /* Filter by category */
    if (category) {
      query.category = category;
    }

    /* Filter by price range */
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    /* Filter by stock availability */
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    } else if (inStock === "false") {
      query.stock = 0;
    }

    /* Pagination */
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    /* Sorting */
    const sortOption = {
      [sort]: order === "asc" ? 1 : -1
    };

    /* DB Query */
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    res.json({
      message: "Products fetched",
      count: products.length,
      data: products,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Product By ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product fetched", data: product });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Product (Admin)
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.category = category || product.category;

    // Upload new images if provided
    if (req.files && req.files.length > 0) {
      // Deleted old image
      for (const oldUrl of product.images) {
        const parts = oldUrl.split('/');
        const filename = parts[parts.length - 1]; //E.g,.for fileName images acb123.jpg
        const publicId = `ecommerce/products/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
      // Replace a new image upload
      product.images = req.files.map(file => file.path);
    }

    await product.save();
    res.json({ message: "Product updated", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* Add Stock */
export const addStock = async (req, res) => {
  const { quantity } = req.body;

  if (quantity <= 0) {
    return res.status(400).json({ message: "Quantity must be positive" });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  product.stock += Number(quantity);
  await product.save();

  res.json({
    message: "Stock added",
    stock: product.stock,
  });
};


/* Delete Product (Admin) */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    /* Delete all image form cloudinary */
    for (const url of product.images) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = `ecommerce/products/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    /* await product.remove(); */
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: "Product deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });

  }
};

/* Toggle wishlist (Add/Remove) */
export const toggleWishlist = async (req, res) => {
  try {
    const productId = req.params.id; /* Get param via id product */
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const [user, product] = await Promise.all([
      User.findById(userId),
      Product.findById(productId).select("_id")
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    const isAdded = user.wishlist.some((id) => id.toString() === productId);

    if (isAdded) {
      await User.findByIdAndUpdate(userId, { $pull: { wishlist: productId } });
      return res.status(200).json({ message: "Removed from wishlist", inWishlist: false });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } });
      return res.status(200).json({ message: "Added to wishlist", inWishlist: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* Get User Wishlist with Product Details */
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json({ data: user.wishlist || [] });
  } catch (error) {
    console.error("DEBUG ERROR:", error); 
    res.status(500).json({ message: error.message }); 
  }
};
