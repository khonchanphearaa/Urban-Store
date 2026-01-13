import Category from "../models/Category.js";

// CREAE Cateogry BY [Admin]
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name, description });
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET All Categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ message: "Categories fetched", data: categories });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category fetched", data: category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE Category BY (Admin)
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    res.json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Category (Admin)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await Category.deleteOne({_id: req.params.id})
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
