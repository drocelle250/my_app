const Category = require("../models/Category");

// GET /api/categories
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [["name", "ASC"]] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/categories
exports.create = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Category name already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/categories/:id
exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await category.update(req.body);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/categories/:id
exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await category.destroy();
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
